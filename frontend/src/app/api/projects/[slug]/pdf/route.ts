import { NextRequest } from "next/server";
import { getProjectBySlug } from "@/features/projects/services/queries";
import { getContentDoc } from "@/lib/db/content";
import { projectPdfKey, projectPdfVersion, renderProjectPdf } from "@/features/projects/services/pdf";
import { getBoss, QUEUES, type PdfRenderJob } from "@/services/queue";
import { getStoredPdfVersion, getUploadedFile, isStorageConfigured } from "@/services/storage";

const WAIT_MS = 60_000;
const POLL_MS = 1_000;

function pdfResponse(body: BodyInit, slug: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project || project.status !== "published") {
    return new Response(null, { status: 404 });
  }
  const origin = request.nextUrl.origin;

  // No bucket (local dev): render in the request, as before.
  if (!isStorageConfigured()) {
    return pdfResponse(new Uint8Array(await renderProjectPdf(origin, slug)), slug);
  }

  const key = projectPdfKey(project.id);
  const version = projectPdfVersion({
    title: project.title,
    summary: project.summary,
    category: project.category,
    authorName: project.authorName,
    coverImageUrl: project.coverImageUrl,
    publishedAt: project.publishedAt,
    steps: await getContentDoc(project.contentDocId),
  });

  // The stored PDF is reused until the write-up changes; otherwise a worker renders it.
  if ((await getStoredPdfVersion(key)) !== version) {
    const boss = await getBoss();
    await boss.send(QUEUES.pdfRender, { slug, key, version, origin } satisfies PdfRenderJob, {
      singletonKey: key,
      retryLimit: 1,
      expireInSeconds: 120,
    });
    const deadline = Date.now() + WAIT_MS;
    while ((await getStoredPdfVersion(key)) !== version) {
      if (Date.now() > deadline) {
        return new Response("The PDF is still being prepared. Try again in a moment.", {
          status: 503,
          headers: { "Retry-After": "15" },
        });
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  }

  const stream = await getUploadedFile(key);
  if (!stream) return new Response(null, { status: 404 });
  return pdfResponse(stream, slug);
}
