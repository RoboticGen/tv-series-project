"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { publishedProjectsFeed, projects, users } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function requireReviewer() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "mentor" && session.user.role !== "admin") {
    throw new Error("Not authorized to moderate projects");
  }
  return session;
}

// Post-hoc moderation list, not a pre-publish queue -- every row here is
// already publicly visible.
export async function listPublishedProjectsForModeration() {
  await requireReviewer();
  const rows = await db
    .select()
    .from(publishedProjectsFeed)
    .orderBy(publishedProjectsFeed.publishedAt);

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getPublishedProjectForModeration(slug: string) {
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
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      createdAt: projects.createdAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(eq(projects.slug, slug));

  if (!project || project.status !== "published") return null;

  const { coverImageId, ...rest } = project;
  return {
    ...rest,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  };
}

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

// Takedown of an already-live project -- reuses 'rejected' as "unpublished
// by moderation", not a pre-publish rejection.
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
