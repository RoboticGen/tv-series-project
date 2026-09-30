"use server";

import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, submissions, users } from "@/db/schema";
import { createContentDoc } from "@/db/content";
import { createSubmissionSchema } from "@/lib/validation";
import type { Step } from "@/lib/steps";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

export async function createSubmission(
  projectId: string,
  input: { steps: Step[]; isPrivate?: boolean },
) {
  const session = await requireSession();
  const parsed = createSubmissionSchema.parse(input);

  const [project] = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      authorId: projects.authorId,
      status: projects.status,
      isFeatured: projects.isFeatured,
    })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error("Project not found");

  const isOwnProject = project.authorId === session.user.id;
  if (!isOwnProject && (project.status !== "published" || !project.isFeatured)) {
    throw new Error("This project isn't featured yet");
  }

  // Only the project's own author may choose to publish their build
  // publicly — everyone else's submission is always private, no matter what
  // they pass in. It only actually becomes visible once the project itself
  // is published/featured (see getPublicSubmissionsForProject).
  const isPrivate = isOwnProject ? Boolean(parsed.isPrivate ?? true) : true;

  const contentDocId = await createContentDoc(
    "submission",
    session.user.id,
    parsed.steps,
  );

  const [submission] = await db
    .insert(submissions)
    .values({
      projectId,
      userId: session.user.id,
      contentDocId,
      isPrivate,
    })
    .returning({ id: submissions.id });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.slug}`);
  redirect(`/dashboard/submissions/${submission.id}`);
}

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
