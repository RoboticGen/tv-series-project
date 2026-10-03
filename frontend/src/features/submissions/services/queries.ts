import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, submissions, users } from "@/lib/db/schema";

export async function getMySubmissions(userId: string) {
  return db
    .select({
      id: submissions.id,
      projectId: submissions.projectId,
      projectTitle: projects.title,
      projectSlug: projects.slug,
      createdAt: submissions.createdAt,
      isPrivate: submissions.isPrivate,
    })
    .from(submissions)
    .innerJoin(projects, eq(submissions.projectId, projects.id))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt));
}

export async function getPublicSubmissionsForProject(projectId: string) {
  return db
    .select({
      id: submissions.id,
      createdAt: submissions.createdAt,
      authorName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(and(eq(submissions.projectId, projectId), eq(submissions.isPrivate, false)))
    .orderBy(desc(submissions.createdAt));
}

export async function getPublicSubmission(id: string) {
  const [submission] = await db
    .select({
      id: submissions.id,
      contentDocId: submissions.contentDocId,
      createdAt: submissions.createdAt,
      isPrivate: submissions.isPrivate,
      projectId: submissions.projectId,
      projectTitle: projects.title,
      projectSlug: projects.slug,
      authorName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(submissions)
    .innerJoin(projects, eq(submissions.projectId, projects.id))
    .innerJoin(users, eq(submissions.userId, users.id))
    .where(eq(submissions.id, id));

  if (!submission || submission.isPrivate) return null;
  return submission;
}

export async function getSubmissionById(id: string, viewerId: string) {
  const [submission] = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      contentDocId: submissions.contentDocId,
      createdAt: submissions.createdAt,
      isPrivate: submissions.isPrivate,
      projectId: submissions.projectId,
      projectTitle: projects.title,
      projectSlug: projects.slug,
    })
    .from(submissions)
    .innerJoin(projects, eq(submissions.projectId, projects.id))
    .where(eq(submissions.id, id));

  if (!submission || submission.userId !== viewerId) return null;
  return submission;
}
