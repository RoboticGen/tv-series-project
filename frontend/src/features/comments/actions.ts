"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { comments, projects, users } from "@/lib/db/schema";
import { createCommentSchema } from "@/features/comments/schemas";
import { isStaff, requireSession } from "@/lib/auth/session";

export async function addComment(projectId: string, body: string, parentCommentId?: string) {
  const session = await requireSession();
  const parsed = createCommentSchema.parse({ body });

  const [project] = await db
    .select({ slug: projects.slug, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error("Project not found");
  if (project.status !== "published") {
    throw new Error("Comments are only allowed on published projects");
  }

  if (parentCommentId) {
    const [parent] = await db
      .select({ projectId: comments.projectId, parentCommentId: comments.parentCommentId })
      .from(comments)
      .where(eq(comments.id, parentCommentId));
    if (!parent || parent.projectId !== projectId) {
      throw new Error("Comment not found");
    }
    if (parent.parentCommentId) {
      throw new Error("Can't reply to a reply");
    }
  }

  await db.insert(comments).values({
    projectId,
    userId: session.user.id,
    parentCommentId: parentCommentId ?? null,
    body: parsed.body,
  });

  revalidatePath(`/projects/${project.slug}`);
}

export async function deleteComment(commentId: string) {
  const session = await requireSession();

  const [comment] = await db
    .select({ userId: comments.userId, projectId: comments.projectId })
    .from(comments)
    .where(eq(comments.id, commentId));
  if (!comment) throw new Error("Comment not found");

  const isAuthor = comment.userId === session.user.id;
  const isModerator = isStaff(session.user.role);
  if (!isAuthor && !isModerator) {
    throw new Error("Not authorized to delete this comment");
  }

  const [project] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, comment.projectId));

  await db.delete(comments).where(eq(comments.id, commentId));

  if (project) revalidatePath(`/projects/${project.slug}`);
}

export async function listComments(projectId: string) {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userId: comments.userId,
      parentCommentId: comments.parentCommentId,
      authorName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.projectId, projectId)))
    .orderBy(asc(comments.createdAt));

  const topLevel = rows.filter((row) => !row.parentCommentId);
  const repliesByParent = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.parentCommentId) continue;
    const replies = repliesByParent.get(row.parentCommentId) ?? [];
    replies.push(row);
    repliesByParent.set(row.parentCommentId, replies);
  }

  function toEntry(row: (typeof rows)[number]) {
    return {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt,
      userId: row.userId,
      authorName: row.authorName,
      authorAvatarUrl: row.authorAvatarUrl,
    };
  }

  return topLevel.map((comment) => ({
    ...toEntry(comment),
    replies: (repliesByParent.get(comment.id) ?? []).map(toEntry),
  }));
}
