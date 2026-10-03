import { listDigestRecipientIds, sendDigestToUser } from "@/features/email-digest/services/digest";
import { isMailConfigured } from "@/services/mailer";
import { renderProjectPdf } from "@/features/projects/services/pdf";
import { getBoss, QUEUES, type DigestSendJob, type PdfRenderJob, type S3DeleteJob } from "@/services/queue";
import { removeUploadedFile, savePdf } from "@/services/storage";

const globalForJobs = globalThis as unknown as { jobsStarted?: boolean };

export async function startJobs() {
  if (globalForJobs.jobsStarted) return;
  globalForJobs.jobsStarted = true;
  const boss = await getBoss();

  // Fans out to one retryable job per recipient.
  await boss.work(QUEUES.digestWeekly, async () => {
    if (!isMailConfigured()) return;
    const userIds = await listDigestRecipientIds();
    if (userIds.length === 0) return;
    await boss.insert(
      QUEUES.digestSend,
      userIds.map((userId) => ({
        data: { userId } satisfies DigestSendJob,
        retryLimit: 3,
        retryDelay: 60,
        retryBackoff: true,
      })),
    );
  });

  await boss.work<DigestSendJob>(QUEUES.digestSend, async ([job]) => {
    await sendDigestToUser(job.data.userId);
  });

  await boss.work<PdfRenderJob>(QUEUES.pdfRender, async ([job]) => {
    const { slug, key, version, origin } = job.data;
    await savePdf(key, await renderProjectPdf(origin, slug), version);
  });

  await boss.work<S3DeleteJob>(QUEUES.s3Delete, async ([job]) => {
    await removeUploadedFile(job.data.key);
  });

  await boss.schedule(QUEUES.digestWeekly, process.env.DIGEST_CRON || "0 8 * * 1", null, {
    tz: process.env.DIGEST_TZ || "UTC",
  });
}
