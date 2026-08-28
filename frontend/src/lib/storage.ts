import { randomUUID } from "node:crypto";
import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";

// Uploaded images live outside frontend/public/ so they can never be
// served as static files directly -- every read goes through
// app/api/media/[id]/route.ts, which enforces ownership/visibility before
// streaming bytes back. media_assets.file_path stores the path returned
// here, relative to STORAGE_ROOT.
function getStorageRoot(): string {
  const root = process.env.STORAGE_ROOT;
  if (!root) throw new Error("STORAGE_ROOT is not configured");
  return path.resolve(root);
}

export function resolveMediaPath(relativePath: string): string {
  return path.join(getStorageRoot(), relativePath);
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function saveUploadedFile(
  file: File,
  ownerType: "project" | "submission",
  ownerId: string,
): Promise<string> {
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) throw new Error(`Unsupported file type: ${file.type}`);

  const relativePath = path.join(
    /* turbopackIgnore: true */ ownerType,
    ownerId,
    `${randomUUID()}.${extension}`,
  );
  const absolutePath = resolveMediaPath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  // Store with forward slashes regardless of host OS so file_path is
  // portable between dev (Windows) and prod (Linux) environments.
  return relativePath.split(path.sep).join("/");
}

export async function deleteUploadedFile(relativePath: string): Promise<void> {
  try {
    await unlink(resolveMediaPath(relativePath));
  } catch {
    // Best-effort -- the file may already be gone, that's fine.
  }
}
