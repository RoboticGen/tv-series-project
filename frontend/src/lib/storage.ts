import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Uploaded images live in a private S3 bucket -- never public-read -- so
// every read goes through app/api/media/[id]/route.ts, which enforces
// ownership/visibility before streaming bytes back. media_assets.file_path
// stores the object key returned here.
//
// S3_ENDPOINT is optional: leave it unset for AWS, or point it at an
// S3-compatible server (MinIO, Cloudflare R2, ...) for local dev.
// Credentials come from the default AWS provider chain
// (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars, IAM role, etc.).
let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    const endpoint = process.env.S3_ENDPOINT || undefined;
    client = new S3Client({
      region: process.env.S3_REGION ?? process.env.AWS_REGION,
      endpoint,
      // MinIO and most self-hosted S3 servers don't support
      // virtual-hosted-style bucket addressing.
      forcePathStyle: Boolean(endpoint),
    });
  }
  return client;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");
  return bucket;
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

  const key = `${ownerType}/${ownerId}/${randomUUID()}.${extension}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );

  return key;
}

// Returns the object's bytes as a web stream, or null if the key doesn't
// exist in the bucket.
export async function getUploadedFile(
  key: string,
): Promise<ReadableStream | null> {
  try {
    const object = await getClient().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    );
    return object.Body?.transformToWebStream() ?? null;
  } catch (err) {
    if (err instanceof NoSuchKey) return null;
    throw err;
  }
}

export async function deleteUploadedFile(key: string): Promise<void> {
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
    );
  } catch {
    // Best-effort -- the object may already be gone, that's fine.
  }
}
