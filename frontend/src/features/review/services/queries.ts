import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { requireReviewer } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";

export type ModerationFeaturedFilter = "all" | "featured" | "not_featured";

export type ModerationSort = "newest" | "oldest" | "top_rated" | "most_liked" | "most_favorited";

const MODERATION_SORTS: Record<ModerationSort, SQL[]> = {
  newest: [desc(projects.publishedAt)],
  oldest: [asc(projects.publishedAt)],

  top_rated: [desc(sql`${projects.likeCount} + ${projects.starCount}`), desc(projects.publishedAt)],
  most_liked: [desc(projects.likeCount), desc(projects.publishedAt)],
  most_favorited: [desc(projects.starCount), desc(projects.publishedAt)],
};

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
