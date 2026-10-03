import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    const endpoint = process.env.S3_ENDPOINT || undefined;
    client = new S3Client({
      region: process.env.S3_REGION ?? process.env.AWS_REGION,
      endpoint,
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

export async function removeUploadedFile(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function deleteUploadedFile(key: string): Promise<void> {
  try {
    await removeUploadedFile(key);
  } catch (err) {
    console.error(`Failed to delete S3 object "${key}", queued for retry`, err);
    try {
      const { getBoss, QUEUES } = await import("@/services/queue");
      const boss = await getBoss();
      await boss.send(QUEUES.s3Delete, { key }, { retryLimit: 5, retryDelay: 60, retryBackoff: true });
    } catch (queueErr) {
      console.error(`Could not queue S3 delete for "${key}"`, queueErr);
    }
  }
}

export function isStorageConfigured() {
  return Boolean(process.env.S3_BUCKET);
}

export async function savePdf(key: string, body: Uint8Array, version: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: "application/pdf",
      Metadata: { version },
    }),
  );
}

export async function getStoredPdfVersion(key: string): Promise<string | null> {
  try {
    const head = await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return head.Metadata?.version ?? null;
  } catch (err) {
    if (err instanceof NotFound || err instanceof NoSuchKey) return null;
    throw err;
  }
}
