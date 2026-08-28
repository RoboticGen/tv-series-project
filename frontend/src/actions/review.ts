"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { pendingReviewQueue, projects, users } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function requireReviewer() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "mentor" && session.user.role !== "admin") {
    throw new Error("Not authorized to review projects");
  }
  return session;
}

export async function listPendingReviewProjects() {
  await requireReviewer();
  const rows = await db
    .select()
    .from(pendingReviewQueue)
    .orderBy(pendingReviewQueue.createdAt);

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getProjectForReview(slug: string) {
  await requireReviewer();

  const [project] = await db
    .select({
      id: projects.id,
      authorId: projects.authorId,
      authorName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
      category: projects.category,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      contentDocId: projects.contentDocId,
      status: projects.status,
      isFeatured: projects.isFeatured,
      rejectionReason: projects.rejectionReason,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      createdAt: projects.createdAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(eq(projects.slug, slug));

  if (!project || project.status !== "pending_review") return null;

  const { coverImageId, ...rest } = project;
  return {
    ...rest,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  };
}

export async function approveProject(projectId: string) {
  const session = await requireReviewer();

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "pending_review") {
    throw new Error("Only projects pending review can be approved");
  }

  const now = new Date();
  await db
    .update(projects)
    .set({
      status: "published",
      isFeatured: true,
      reviewedById: session.user.id,
      reviewedAt: now,
      publishedAt: now,
      rejectionReason: null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard/review");
  revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/projects");
}

export async function rejectProject(projectId: string, reason: string) {
  const session = await requireReviewer();
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5) {
    throw new Error("Give a reason of at least 5 characters");
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "pending_review") {
    throw new Error("Only projects pending review can be rejected");
  }

  await db
    .update(projects)
    .set({
      status: "rejected",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: trimmedReason,
    })
    .where(eq(projects.id, projectId));

  revalidatePath("/dashboard/review");
  revalidatePath(`/projects/${project.slug}`);
}
