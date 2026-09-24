"use server";

import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, users } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function requireReviewer() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "mentor" && session.user.role !== "admin") {
    throw new Error("Not authorized to moderate projects");
  }
  return session;
}

export type ModerationFeaturedFilter = "all" | "featured" | "not_featured";
export type ModerationSort = "newest" | "oldest" | "top_rated" | "most_liked" | "most_favorited";

const MODERATION_SORTS: Record<ModerationSort, SQL[]> = {
  newest: [desc(projects.publishedAt)],
  oldest: [asc(projects.publishedAt)],
  // Likes and favorites are the only rating signal there is -- weight
  // them equally, newest first on a tie.
  top_rated: [desc(sql`${projects.likeCount} + ${projects.starCount}`), desc(projects.publishedAt)],
  most_liked: [desc(projects.likeCount), desc(projects.publishedAt)],
  most_favorited: [desc(projects.starCount), desc(projects.publishedAt)],
};

// Post-hoc moderation list, not a pre-publish queue -- every row here is
// already publicly visible. Queries projects directly rather than the
// published_projects_feed view, which has no like/star counts to rank by.
export async function listPublishedProjectsForModeration(options?: {
  query?: string;
  category?: string;
  featured?: ModerationFeaturedFilter;
  sort?: ModerationSort;
}) {
  await requireReviewer();

  const baseConditions = [eq(projects.status, "published")];
  if (options?.category && (projects.category.enumValues as string[]).includes(options.category)) {
    baseConditions.push(
      eq(projects.category, options.category as (typeof projects.category.enumValues)[number]),
    );
  }
  if (options?.query) {
    const term = `%${options.query}%`;
    baseConditions.push(
      or(ilike(projects.title, term), ilike(projects.summary, term), ilike(users.displayName, term))!,
    );
  }

  const conditions = [...baseConditions];
  if (options?.featured === "featured") conditions.push(eq(projects.isFeatured, true));
  if (options?.featured === "not_featured") conditions.push(eq(projects.isFeatured, false));

  const [rows, [counts]] = await Promise.all([
    db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        summary: projects.summary,
        category: projects.category,
        authorName: users.displayName,
        likeCount: projects.likeCount,
        starCount: projects.starCount,
        isFeatured: projects.isFeatured,
        coverImageId: projects.coverImageId,
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .where(and(...conditions))
      .orderBy(...MODERATION_SORTS[options?.sort ?? "newest"] ?? MODERATION_SORTS.newest),
    // Tab counts ignore the featured filter itself, so every tab shows how
    // many it would match under the current search/category.
    db
      .select({
        all: sql<number>`count(*)::int`,
        featured: sql<number>`count(*) filter (where ${projects.isFeatured})::int`,
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .where(and(...baseConditions)),
  ]);

  return {
    projects: rows.map(({ coverImageId, ...row }) => ({
      ...row,
      coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
    })),
    counts: {
      all: counts.all,
      featured: counts.featured,
      not_featured: counts.all - counts.featured,
    },
  };
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
  const session = await requireReviewer();

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "published") {
    throw new Error("Only published projects can be featured");
  }
  // Featuring pays the author points (award_featured_points), so a reviewer
  // can't feature their own project -- same rule as self-stars/self-builds.
  if (project.authorId === session.user.id) {
    throw new Error("You can't feature your own project");
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
      // A taken-down project is no longer featured anywhere -- clearing the
      // flag keeps the dashboard stats, badges and sort honest.
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
