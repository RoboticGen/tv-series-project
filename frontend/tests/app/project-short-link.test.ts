import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { dbHolder } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";
import { GET } from "@/app/p/[id]/route";
import { projectQrSvg, projectShortUrl } from "@/features/projects/services/links";
import { SITE_URL } from "@/lib/config/site";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
});

afterEach(async () => {
  await handle.close();
});

function visit(id: string) {
  return GET(new Request(`http://localhost/p/${id}`), { params: Promise.resolve({ id }) });
}

async function publishedProject(slug: string) {
  const author = await insertUser(handle.db);
  const mentor = await insertUser(handle.db, { role: "mentor" });
  return insertProject(handle.db, author.id, {
    slug,
    status: "published",
    publishedAt: new Date(),
    reviewedById: mentor.id,
    reviewedAt: new Date(),
  });
}

describe("/p/[id] short link", () => {
  it("redirects to the project's current slug, even after a rename", async () => {
    const project = await publishedProject("line-robot");
    await handle.db.update(schema.projects).set({ slug: "line-following-robot" }).where(eq(schema.projects.id, project.id));

    const res = await visit(project.id);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/projects/line-following-robot");
  });

  it("404s for drafts, unknown ids and malformed ids", async () => {
    const author = await insertUser(handle.db);
    const draft = await insertProject(handle.db, author.id);

    expect((await visit(draft.id)).status).toBe(404);
    expect((await visit(crypto.randomUUID())).status).toBe(404);
    expect((await visit("not-a-uuid")).status).toBe(404);
  });
});

describe("project QR code", () => {
  it("encodes the permanent short link as an SVG", async () => {
    const id = crypto.randomUUID();
    expect(projectShortUrl(id)).toBe(`${SITE_URL}/p/${id}`);
    expect(await projectQrSvg(id)).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
  });
});
