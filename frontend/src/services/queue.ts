import "server-only";
import { PgBoss } from "pg-boss";

export const QUEUES = {
  digestWeekly: "digest-weekly",
  digestSend: "digest-send",
  pdfRender: "pdf-render",
  s3Delete: "s3-delete",
} as const;

export interface DigestSendJob {
  userId: string;
}
export interface PdfRenderJob {
  slug: string;
  key: string;
  version: string;
  origin: string;
}
export interface S3DeleteJob {
  key: string;
}

const globalForBoss = globalThis as unknown as { pgBoss?: Promise<PgBoss> };

async function start() {
  const boss = new PgBoss(process.env.DATABASE_URL!);
  boss.on("error", (err) => console.error("pg-boss error", err));
  await boss.start();
  await boss.createQueue(QUEUES.digestWeekly);
  await boss.createQueue(QUEUES.digestSend);
  await boss.createQueue(QUEUES.s3Delete);
  await boss.createQueue(QUEUES.pdfRender, { policy: "exclusive" });
  return boss;
}

export function getBoss() {
  if (!globalForBoss.pgBoss) {
    globalForBoss.pgBoss = start().catch((err) => {
      globalForBoss.pgBoss = undefined;
      throw err;
    });
  }
  return globalForBoss.pgBoss;
}
