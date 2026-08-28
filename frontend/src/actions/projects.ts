"use server";

import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { projectLikes, projects, projectStars, users } from "@/db/schema";
import { createContentDoc, updateContentDoc } from "@/db/content";
import { slugify, randomSlugSuffix } from "@/lib/slug";
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

export async function createDraftProject() {
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

  return { starred: !existing };
}

export async function getFeaturedProjects() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorName: users.displayName,
      publishedAt: projects.publishedAt,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(eq(projects.status, "published"), eq(projects.isFeatured, true)))
    .orderBy(desc(projects.publishedAt))
    .limit(12);
}

export async function listPublishedProjects(options?: {
  category?: string;
  page?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = 12;

  const conditions = [eq(projects.status, "published")];
  if (options?.category) {
    conditions.push(eq(projects.category, options.category as (typeof projects.category.enumValues)[number]));
  }

  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorName: users.displayName,
      publishedAt: projects.publishedAt,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(projects.publishedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
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
      publishedAt: projects.publishedAt,
      createdAt: projects.createdAt,
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

  return { ...project, viewerHasLiked, viewerHasStarred };
}

export async function getMyProjects(userId: string) {
  return db
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
    })
    .from(projects)
    .where(eq(projects.authorId, userId))
    .orderBy(desc(projects.createdAt));
}
