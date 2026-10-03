"use server";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { mediaAssets, projectLikes, projects, projectStars, submissions } from "@/lib/db/schema";
import { createContentDoc, updateContentDoc, deleteContentDoc } from "@/lib/db/content";
import { untouchedDraft } from "@/lib/db/untouched-draft";
import { slugify, randomSlugSuffix } from "@/shared/lib/slug";
import { projectPdfKey } from "@/features/projects/services/pdf";
import { deleteUploadedFile } from "@/services/storage";
import { updateProjectSchema } from "@/features/projects/schemas";
import { newStep, type Step } from "@/lib/models/steps";
import { requireSession } from "@/lib/auth/session";

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
  const [reused, ...extras] = await db
    .select({ id: projects.id, slug: projects.slug, contentDocId: projects.contentDocId })
    .from(projects)
    .where(and(eq(projects.authorId, session.user.id), untouchedDraft))
    .orderBy(desc(projects.createdAt));
  if (extras.length > 0) {
    await Promise.all(extras.map((p) => deleteContentDoc(p.contentDocId)));
    await db.delete(projects).where(
      inArray(
        projects.id,
        extras.map((p) => p.id),
      ),
    );
  }
  if (reused) return { id: reused.id, slug: reused.slug };

  const slug = await generateUniqueSlug("untitled-project");
  const contentDocId = await createContentDoc("project", "pending", [newStep()]);

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

export async function createDraftProject() {
  const project = await createDraftProjectRecord();
  redirect(`/projects/${project.slug}/edit`);
}

export async function updateProject(
  projectId: string,
  input: { title: string; summary: string; category: string; steps: Step[] },
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
  await updateContentDoc(project.contentDocId, parsed.steps);

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

export async function publishProject(projectId: string) {
  const session = await requireSession();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to publish this project");
  }
  if (project.status !== "draft" && project.status !== "rejected") {
    throw new Error("Only draft or unpublished projects can be published");
  }

  await db
    .update(projects)
    .set({
      status: "published",
      publishedAt: new Date(),
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function revertProjectToDraft(projectId: string) {
  const session = await requireSession();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project || project.authorId !== session.user.id) {
    throw new Error("Not authorized to unpublish this project");
  }
  if (project.status !== "published") {
    throw new Error("Only published projects can be unpublished");
  }

  await db
    .update(projects)
    .set({
      status: "draft",
      isFeatured: false,
      publishedAt: null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${project.slug}`);
  revalidatePath(`/projects/${project.slug}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
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

  const projectSubmissions = await db
    .select({ id: submissions.id, contentDocId: submissions.contentDocId })
    .from(submissions)
    .where(eq(submissions.projectId, projectId));
  const submissionIds = projectSubmissions.map((s) => s.id);

  const assets = await db
    .select({ filePath: mediaAssets.filePath })
    .from(mediaAssets)
    .where(
      or(
        and(eq(mediaAssets.ownerType, "project"), eq(mediaAssets.ownerId, projectId)),
        submissionIds.length > 0
          ? and(eq(mediaAssets.ownerType, "submission"), inArray(mediaAssets.ownerId, submissionIds))
          : undefined,
      ),
    );

  await db.delete(projects).where(eq(projects.id, projectId));
  await Promise.all([...assets.map((a) => a.filePath), projectPdfKey(projectId)].map(deleteUploadedFile));
  await Promise.all(
    [project, ...projectSubmissions].map((row) => deleteContentDoc(row.contentDocId)),
  );

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
