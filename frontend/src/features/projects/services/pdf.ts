import "server-only";
import { createHash } from "node:crypto";

export function projectPdfKey(projectId: string) {
  return `pdf/${projectId}.pdf`;
}

export function projectPdfVersion(content: unknown) {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 32);
}

export async function renderProjectPdf(origin: string, slug: string): Promise<Uint8Array> {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${origin}/projects/${slug}/print`, { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
}
