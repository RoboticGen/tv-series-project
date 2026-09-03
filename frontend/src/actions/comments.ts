"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { comments, projects, users } from "@/db/schema";
import { createCommentSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

export async function addComment(projectId: string, body: string) {
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

  await db.insert(comments).values({
    projectId,
    userId: session.user.id,
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
  const isModerator = session.user.role === "mentor" || session.user.role === "admin";
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
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      userId: comments.userId,
      authorName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.projectId, projectId)))
    .orderBy(asc(comments.createdAt));
}
