"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, projects, submissions } from "@/db/schema";
import { saveUploadedFile } from "@/lib/storage";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";

async function assertOwnership(
  ownerType: "project" | "submission",
  ownerId: string,
  userId: string,
) {
  if (ownerType === "project") {
    const [project] = await db
      .select({ authorId: projects.authorId })
      .from(projects)
      .where(eq(projects.id, ownerId));
    if (!project || project.authorId !== userId) {
      throw new Error("Not authorized to upload to this project");
    }
  } else {
    const [submission] = await db
      .select({ userId: submissions.userId })
      .from(submissions)
      .where(eq(submissions.id, ownerId));
    if (!submission || submission.userId !== userId) {
      throw new Error("Not authorized to upload to this submission");
    }
  }
}

export async function uploadMediaAsset(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const file = formData.get("file");
  const ownerType = formData.get("ownerType");
  const ownerId = formData.get("ownerId");

  if (!(file instanceof File)) throw new Error("No file provided");
  if (ownerType !== "project" && ownerType !== "submission") {
    throw new Error("Invalid ownerType");
  }
  if (typeof ownerId !== "string" || !ownerId) {
    throw new Error("Invalid ownerId");
  }
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Unsupported file type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("File too large");
  }

  await assertOwnership(ownerType, ownerId, session.user.id);

  const filePath = await saveUploadedFile(file, ownerType, ownerId);

  const [mediaAsset] = await db
    .insert(mediaAssets)
    .values({ ownerType, ownerId, filePath })
    .returning({ id: mediaAssets.id });

  return { id: mediaAsset.id, url: `/api/media/${mediaAsset.id}` };
}
