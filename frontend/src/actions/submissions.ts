"use server";

import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, submissions } from "@/db/schema";
import { createContentDoc } from "@/db/content";
import { createSubmissionSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

export async function createSubmission(
  projectId: string,
  input: { body: string },
) {
  const session = await requireSession();
  const parsed = createSubmissionSchema.parse(input);

  const [project] = await db
    .select({ id: projects.id, authorId: projects.authorId, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error("Project not found");

  const isOwnProject = project.authorId === session.user.id;
  if (!isOwnProject && project.status !== "published") {
    throw new Error("This project isn't published yet");
  }

  const contentDocId = await createContentDoc(
    "submission",
    session.user.id,
    parsed.body,
  );

  const [submission] = await db
    .insert(submissions)
    .values({
      projectId,
      userId: session.user.id,
      contentDocId,
      isPrivate: true,
    })
    .returning({ id: submissions.id });

  revalidatePath("/dashboard");
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
    })
    .from(submissions)
    .innerJoin(projects, eq(submissions.projectId, projects.id))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt));
}

export async function getSubmissionById(id: string, viewerId: string) {
  const [submission] = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      contentDocId: submissions.contentDocId,
      createdAt: submissions.createdAt,
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
