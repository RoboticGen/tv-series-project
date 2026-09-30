import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, projects, submissions } from "@/db/schema";
import { getUploadedFile } from "@/lib/storage";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [asset] = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id));
  if (!asset) return new Response(null, { status: 404 });

  const session = await auth();
  const viewerId = session?.user?.id;

  let isPublic = false;

  if (asset.ownerType === "project") {
    const [project] = await db
      .select({ status: projects.status, authorId: projects.authorId })
      .from(projects)
      .where(eq(projects.id, asset.ownerId));
    if (!project) return new Response(null, { status: 404 });
    const visible =
      project.status === "published" || viewerId === project.authorId;
    if (!visible) return new Response(null, { status: 404 });
    isPublic = project.status === "published";
  } else {
    const [submission] = await db
      .select({ userId: submissions.userId })
      .from(submissions)
      .where(eq(submissions.id, asset.ownerId));
    if (!submission || viewerId !== submission.userId) {
      return new Response(null, { status: 404 });
    }
  }

  const extension = asset.filePath.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";

  const body = await getUploadedFile(asset.filePath);
  if (!body) return new Response(null, { status: 404 });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isPublic
        ? "public, max-age=86400"
        : "private, max-age=0, must-revalidate",
    },
  });
}
