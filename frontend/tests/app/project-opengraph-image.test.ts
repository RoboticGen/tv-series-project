import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import * as schema from "@/db/schema";
import { dbHolder } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDb, type TestDbHandle } from "../setup/pglite-db";
import { getUploadedFile } from "@/lib/storage";
import Image from "@/app/projects/[slug]/opengraph-image";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  vi.mocked(getUploadedFile).mockClear();
});

afterEach(async () => {
  await handle.close();
});

// Set OG_PREVIEW_DIR to eyeball the generated cards, e.g.
// OG_PREVIEW_DIR=/tmp npx vitest run tests/app/project-opengraph-image.test.ts
async function render(slug: string, previewName: string) {
  const res = await Image({ params: Promise.resolve({ slug }) });
  const png = Buffer.from(await res.arrayBuffer());
  if (process.env.OG_PREVIEW_DIR) await writeFile(join(process.env.OG_PREVIEW_DIR, `${previewName}.png`), png);
  return { res, png };
}

async function insertPublishedProject(db: TestDb, overrides: Partial<typeof schema.projects.$inferInsert> = {}) {
  const author = await insertUser(db, { displayName: "Kasun Perera", points: 75 });
  const mentor = await insertUser(db, { role: "mentor" });
  return insertProject(db, author.id, {
    title: "Line Following Robot with PID Control",
    status: "published",
    publishedAt: new Date(),
    reviewedById: mentor.id,
    reviewedAt: new Date(),
    ...overrides,
  });
}

async function attachCover(db: TestDb, projectId: string, filePath: string) {
  const [asset] = await db
    .insert(schema.mediaAssets)
    .values({ ownerType: "project", ownerId: projectId, filePath })
    .returning();
  await db.update(schema.projects).set({ coverImageId: asset.id }).where(eq(schema.projects.id, projectId));
}

async function imageStream(format: "png" | "webp") {
  const bytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#e87a55" } })
    [format]()
    .toBuffer();
  return new Response(bytes).body!;
}

describe("project Open Graph image", () => {
  it("renders a 1200x630 PNG card for a published project", async () => {
    const project = await insertPublishedProject(handle.db, { isFeatured: true });
    await attachCover(handle.db, project.id, "project/p/cover.png");
    vi.mocked(getUploadedFile).mockResolvedValueOnce(await imageStream("png"));

    const { res, png } = await render(project.slug, "og-published");

    expect(res.headers.get("content-type")).toBe("image/png");
    expect(await sharp(png).metadata()).toMatchObject({ width: 1200, height: 630, format: "png" });
    expect(getUploadedFile).toHaveBeenCalledWith("project/p/cover.png");
  });

  it("handles WebP covers, which next/og can't decode on its own", async () => {
    const project = await insertPublishedProject(handle.db);
    await attachCover(handle.db, project.id, "project/p/cover.webp");
    vi.mocked(getUploadedFile).mockResolvedValueOnce(await imageStream("webp"));

    const { res } = await render(project.slug, "og-webp-cover");

    expect(res.status).toBe(200);
  });

  it("still renders when the cover can't be read", async () => {
    const project = await insertPublishedProject(handle.db);
    await attachCover(handle.db, project.id, "project/p/missing.png");
    vi.mocked(getUploadedFile).mockRejectedValueOnce(new Error("S3 down"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    const { res } = await render(project.slug, "og-no-cover");

    expect(res.status).toBe(200);
  });

  it("fits a maximum-length title and author name", async () => {
    const project = await insertPublishedProject(handle.db, {
      title: "Autonomous Solar Powered Greenhouse Monitor with LoRa Mesh Networking and Cloud Dashboard",
    });

    const { res } = await render(project.slug, "og-long-title");

    expect(res.status).toBe(200);
  });

  it("gives drafts the generic card without reading their cover", async () => {
    const author = await insertUser(handle.db);
    const draft = await insertProject(handle.db, author.id, { title: "Secret draft" });
    await attachCover(handle.db, draft.id, "project/p/secret.png");

    const { res } = await render(draft.slug, "og-draft");

    expect(res.status).toBe(200);
    expect(getUploadedFile).not.toHaveBeenCalled();
  });
});
