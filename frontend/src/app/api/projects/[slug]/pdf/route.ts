import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import { getProjectBySlug } from "@/actions/projects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project || project.status !== "published") {
    return new Response(null, { status: 404 });
  }

  // Chrome's sandbox can't start inside Docker (no unprivileged user
  // namespaces); the Dockerfile sets this and the container is the boundary.
  const browser = await puppeteer.launch({
    args: process.env.PUPPETEER_NO_SANDBOX === "1" ? ["--no-sandbox"] : [],
  });
  let pdfBuffer: Uint8Array;
  try {
    const page = await browser.newPage();
    await page.goto(`${request.nextUrl.origin}/projects/${slug}/print`, {
      waitUntil: "networkidle0",
    });
    pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
    },
  });
}
