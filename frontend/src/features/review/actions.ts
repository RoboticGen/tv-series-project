"use server";

import { eq } from "drizzle-orm";
import { requireReviewer } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function toggleFeatured(projectId: string) {
  await requireReviewer();

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "published") {
    throw new Error("Only published projects can be featured");
  }

  await db
    .update(projects)
    .set({ isFeatured: !project.isFeatured })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard/review");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");

  return { isFeatured: !project.isFeatured };
}

export async function unpublishProject(projectId: string, reason: string) {
  const session = await requireReviewer();
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5) {
    throw new Error("Give a reason of at least 5 characters");
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "published") {
    throw new Error("Only published projects can be unpublished");
  }

  await db
    .update(projects)
    .set({
      status: "rejected",
      isFeatured: false,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: trimmedReason,
      publishedAt: null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard/review");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
