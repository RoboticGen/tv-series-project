import { createReadStream } from "node:fs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, projects, submissions } from "@/db/schema";
import { resolveMediaPath } from "@/lib/storage";

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

  const absolutePath = resolveMediaPath(asset.filePath);
  const stream = createReadStream(absolutePath);
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isPublic
        ? "public, max-age=86400"
        : "private, max-age=0, must-revalidate",
    },
  });
}
