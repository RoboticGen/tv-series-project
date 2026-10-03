"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { pointEvents, projects, submissions } from "@/lib/db/schema";
import { createContentDoc } from "@/lib/db/content";
import { EARNED_PARAM } from "@/features/gamification/earned-points";
import { createSubmissionSchema } from "@/features/submissions/schemas";
import type { Step } from "@/lib/models/steps";
import { requireSession } from "@/lib/auth/session";

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

  const isPrivate = isOwnProject ? Boolean(parsed.isPrivate ?? true) : true;

  const contentDocId = await createContentDoc(
    "submission",
    session.user.id,
    parsed.steps,
  );

  const buildPoints = () =>
    db
      .select({ points: pointEvents.points })
      .from(pointEvents)
      .where(
        and(
          eq(pointEvents.userId, session.user.id),
          eq(pointEvents.projectId, projectId),
          eq(pointEvents.reason, "submission_created"),
        ),
      );
  const [alreadyAwarded] = await buildPoints();

  const [submission] = await db
    .insert(submissions)
    .values({
      projectId,
      userId: session.user.id,
      contentDocId,
      isPrivate,
    })
    .returning({ id: submissions.id });

  const [award] = alreadyAwarded ? [] : await buildPoints();

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${project.slug}`);
  redirect(`/dashboard/submissions/${submission.id}${award ? `?${EARNED_PARAM}=${award.points}` : ""}`);
}
