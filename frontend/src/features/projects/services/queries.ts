import "server-only";
import { and, count, desc, eq, ilike, not, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectLikes, projects, projectStars, users } from "@/lib/db/schema";
import { untouchedDraft } from "@/lib/db/untouched-draft";

export async function getFeaturedProjects(options?: {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;

  const conditions = [eq(projects.status, "published"), eq(projects.isFeatured, true)];
  if (options?.category) {
    conditions.push(eq(projects.category, options.category as (typeof projects.category.enumValues)[number]));
  }
  if (options?.query) {
    const term = `%${options.query}%`;
    conditions.push(or(ilike(projects.title, term), ilike(projects.summary, term))!);
  }

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorId: projects.authorId,
      authorName: users.displayName,
      publishedAt: projects.publishedAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(projects.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

const BROWSE_PAGE_SIZE = 12;

interface BrowseFilters {
  query?: string;
  category?: string;
  featured?: boolean;
}

function browseConditions(options?: BrowseFilters) {
  const conditions = [eq(projects.status, "published")];
  if (options?.category) {
    conditions.push(eq(projects.category, options.category as (typeof projects.category.enumValues)[number]));
  }
  if (options?.query) {
    const term = `%${options.query}%`;
    conditions.push(or(ilike(projects.title, term), ilike(projects.summary, term))!);
  }
  if (options?.featured) conditions.push(eq(projects.isFeatured, true));
  return conditions;
}

export async function countPublishedProjectPages(options?: BrowseFilters) {
  const [row] = await db
    .select({ total: count() })
    .from(projects)
    .where(and(...browseConditions(options)));
  return Math.max(1, Math.ceil((row?.total ?? 0) / BROWSE_PAGE_SIZE));
}

export async function getPublishedProjects(options?: BrowseFilters & { page?: number }) {
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = BROWSE_PAGE_SIZE;
  const conditions = browseConditions(options);

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorId: projects.authorId,
      authorName: users.displayName,
      isFeatured: projects.isFeatured,
      publishedAt: projects.publishedAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(projects.isFeatured), desc(projects.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getProjectBySlug(slug: string, viewerId?: string) {
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
      viewCount: projects.viewCount,
      publishedAt: projects.publishedAt,
      createdAt: projects.createdAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(eq(projects.slug, slug));

  if (!project) return null;

  let viewerHasLiked = false;
  let viewerHasStarred = false;
  if (viewerId) {
    const [like] = await db
      .select()
      .from(projectLikes)
      .where(and(eq(projectLikes.userId, viewerId), eq(projectLikes.projectId, project.id)));
    const [star] = await db
      .select()
      .from(projectStars)
      .where(and(eq(projectStars.userId, viewerId), eq(projectStars.projectId, project.id)));
    viewerHasLiked = Boolean(like);
    viewerHasStarred = Boolean(star);
  }

  const { coverImageId, ...rest } = project;
  return {
    ...rest,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
    viewerHasLiked,
    viewerHasStarred,
  };
}

export async function getMyProjects(userId: string) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      status: projects.status,
      isFeatured: projects.isFeatured,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      rejectionReason: projects.rejectionReason,
      createdAt: projects.createdAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .where(and(eq(projects.authorId, userId), not(untouchedDraft)))
    .orderBy(desc(projects.createdAt));

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getPublishedProjectsByAuthor(authorId: string) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      coverImageId: projects.coverImageId,
      publishedAt: projects.publishedAt,
    })
    .from(projects)
    .where(and(eq(projects.authorId, authorId), eq(projects.status, "published")))
    .orderBy(desc(projects.publishedAt));

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getMyStarredProjects(userId: string) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorName: users.displayName,
      coverImageId: projects.coverImageId,
      starredAt: projectStars.startedAt,
    })
    .from(projectStars)
    .innerJoin(projects, eq(projectStars.projectId, projects.id))
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(eq(projectStars.userId, userId), eq(projects.status, "published")))
    .orderBy(desc(projectStars.startedAt));

  return rows.map(({ coverImageId, ...row }) => ({
    ...row,
    coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
  }));
}

export async function getCommunityCounts() {
  const [[projectCounts], [userCounts]] = await Promise.all([
    db
      .select({
        published: sql<number>`count(*) filter (where ${projects.status} = 'published')`.mapWith(Number),
        featured: sql<number>`count(*) filter (where ${projects.status} = 'published' and ${projects.isFeatured})`.mapWith(Number),
      })
      .from(projects),

    db
      .select({ makers: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(eq(users.role, "student")),
  ]);

  return {
    publishedProjects: projectCounts?.published ?? 0,
    featuredProjects: projectCounts?.featured ?? 0,
    makers: userCounts?.makers ?? 0,
  };
}
