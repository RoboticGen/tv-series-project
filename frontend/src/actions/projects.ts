"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, projectLikes, projects, projectStars, users } from "@/db/schema";
import { createContentDoc, updateContentDoc, deleteContentDoc } from "@/db/content";
import { slugify, randomSlugSuffix } from "@/lib/slug";
import { deleteUploadedFile } from "@/lib/storage";
import { updateProjectSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title);
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, base));
  return existing ? `${base}-${randomSlugSuffix()}` : base;
}

export async function createDraftProjectRecord() {
  const session = await requireSession();

  const slug = await generateUniqueSlug("untitled-project");
  const contentDocId = await createContentDoc("project", "pending", "");

  const [project] = await db
    .insert(projects)
    .values({
      authorId: session.user.id,
      category: "other",
      title: "Untitled project",
      slug,
      summary: "",
      contentDocId,
      status: "draft",
    })
    .returning({ id: projects.id, slug: projects.slug });

  return project;
}

// Used by the fallback /projects/new page (direct navigation/refresh, no
// client-side transition to intercept into the slide-in panel).
export async function createDraftProject() {
  const project = await createDraftProjectRecord();
  redirect(`/projects/${project.slug}/edit`);
}

export async function updateProject(
  projectId: string,
  input: { title: string; summary: string; category: string; body: string },
) {
  const session = await requireSession();
  const parsed = updateProjectSchema.parse(input);

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to edit this project");
  }

  let slug = project.slug;
  if (parsed.title !== project.title) {
    slug = await generateUniqueSlug(parsed.title);
  }

  await db
    .update(projects)
    .set({
      title: parsed.title,
      summary: parsed.summary,
      category: parsed.category,
      slug,
    })
    .where(eq(projects.id, projectId));
  await updateContentDoc(project.contentDocId, parsed.body);

  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/edit`);
  revalidatePath("/dashboard");

  return { slug };
}

export async function setProjectCoverImage(projectId: string, mediaAssetId: string | null) {
  const session = await requireSession();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to edit this project");
  }

  const previousCoverImageId = project.coverImageId;
  await db
    .update(projects)
    .set({ coverImageId: mediaAssetId })
    .where(eq(projects.id, projectId));

  // Replacing/removing a cover doesn't remove it from the write-up body if
  // it happens to also be embedded there -- only clean up the file if
  // nothing else in media_assets still needs it as a distinct asset row.
  if (previousCoverImageId && previousCoverImageId !== mediaAssetId) {
    const [oldAsset] = await db
      .select({ filePath: mediaAssets.filePath })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, previousCoverImageId));
    if (oldAsset) {
      await deleteUploadedFile(oldAsset.filePath);
      await db.delete(mediaAssets).where(eq(mediaAssets.id, previousCoverImageId));
    }
  }

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function requestPublish(projectId: string) {
  const session = await requireSession();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to publish this project");
  }
  if (project.status !== "draft" && project.status !== "rejected") {
    throw new Error("Only draft or rejected projects can be resubmitted");
  }

  await db
    .update(projects)
    .set({ status: "pending_review", rejectionReason: null })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/edit`);
  revalidatePath("/dashboard");
}

export async function deleteProject(projectId: string) {
  const session = await requireSession();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to delete this project");
  }

  const assets = await db
    .select({ filePath: mediaAssets.filePath })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.ownerType, "project"), eq(mediaAssets.ownerId, projectId)));

  // Postgres cascade deletes the project row's likes/stars/submissions/
  // media_assets rows; the files on disk and the Mongo body aren't
  // Postgres's problem, clean those up ourselves first.
  await Promise.all(assets.map((a) => deleteUploadedFile(a.filePath)));
  await deleteContentDoc(project.contentDocId);
  await db.delete(projects).where(eq(projects.id, projectId));

  revalidatePath("/dashboard");
}

export async function toggleLike(projectId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(projectLikes)
    .where(and(eq(projectLikes.userId, userId), eq(projectLikes.projectId, projectId)));

  if (existing) {
    await db
      .delete(projectLikes)
      .where(and(eq(projectLikes.userId, userId), eq(projectLikes.projectId, projectId)));
  } else {
    await db.insert(projectLikes).values({ userId, projectId });
  }

  const [project] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (project) revalidatePath(`/projects/${project.slug}`);

  return { liked: !existing };
}

export async function toggleStar(projectId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(projectStars)
    .where(and(eq(projectStars.userId, userId), eq(projectStars.projectId, projectId)));

  if (existing) {
    await db
      .delete(projectStars)
      .where(and(eq(projectStars.userId, userId), eq(projectStars.projectId, projectId)));
  } else {
    await db.insert(projectStars).values({ userId, projectId });
  }

  const [project] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (project) revalidatePath(`/projects/${project.slug}`);
  revalidatePath("/dashboard");

  return { starred: !existing };
}

export async function getFeaturedProjects(options?: {
  query?: string;
  category?: string;
  page?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = 12;

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
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      rejectionReason: projects.rejectionReason,
      createdAt: projects.createdAt,
      coverImageId: projects.coverImageId,
    })
    .from(projects)
    .where(eq(projects.authorId, userId))
    .orderBy(desc(projects.createdAt));

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
