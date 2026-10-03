import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { dbHolder } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDb, type TestDbHandle } from "../setup/pglite-db";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/config/site";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
});

afterEach(async () => {
  await handle.close();
});

async function publish(db: TestDb, authorId: string, slug: string) {
  const mentor = await insertUser(db, { role: "mentor" });
  return insertProject(db, authorId, {
    slug,
    status: "published",
    publishedAt: new Date(),
    reviewedById: mentor.id,
    reviewedAt: new Date(),
  });
}

async function insertCollection(db: TestDb, ownerId: string, slug: string, opts: { isPrivate: boolean; projectId?: string }) {
  const [collection] = await db
    .insert(schema.collections)
    .values({ ownerId, title: slug, slug, isPrivate: opts.isPrivate })
    .returning();
  if (opts.projectId) {
    await db.insert(schema.collectionItems).values({ collectionId: collection.id, projectId: opts.projectId });
  }
  return collection;
}

async function urls() {
  return (await sitemap()).map((entry) => entry.url.replace(SITE_URL, ""));
}

describe("sitemap", () => {
  it("lists the home and browse pages", async () => {
    expect(await urls()).toEqual(["/", "/projects"]);
  });

  it("lists published projects and their authors, never drafts", async () => {
    const author = await insertUser(handle.db);
    const draftOnlyAuthor = await insertUser(handle.db);
    await publish(handle.db, author.id, "published-robot");
    await insertProject(handle.db, author.id, { slug: "secret-draft" });
    await insertProject(handle.db, draftOnlyAuthor.id, { slug: "other-draft" });

    const listed = await urls();

    expect(listed).toContain("/projects/published-robot");
    expect(listed).toContain(`/authors/${author.id}`);
    expect(listed).not.toContain("/projects/secret-draft");
    expect(listed).not.toContain("/projects/other-draft");
    expect(listed).not.toContain(`/authors/${draftOnlyAuthor.id}`);
  });

  it("leaves out disabled authors' profiles", async () => {
    const author = await insertUser(handle.db, { isDisabled: true });
    await publish(handle.db, author.id, "by-disabled-author");

    expect(await urls()).not.toContain(`/authors/${author.id}`);
  });

  it("lists only public, non-empty collections", async () => {
    const owner = await insertUser(handle.db);
    const project = await publish(handle.db, owner.id, "in-collections");
    await insertCollection(handle.db, owner.id, "public-picks", { isPrivate: false, projectId: project.id });
    await insertCollection(handle.db, owner.id, "private-picks", { isPrivate: true, projectId: project.id });
    await insertCollection(handle.db, owner.id, "empty-picks", { isPrivate: false });

    const listed = await urls();

    expect(listed).toContain("/collections/public-picks");
    expect(listed).not.toContain("/collections/private-picks");
    expect(listed).not.toContain("/collections/empty-picks");
  });
});

describe("robots", () => {
  it("points at the sitemap and keeps private areas out of search", () => {
    const { rules, sitemap: sitemapUrl } = robots();
    expect(sitemapUrl).toBe(`${SITE_URL}/sitemap.xml`);
    expect(rules).toMatchObject({
      allow: expect.arrayContaining(["/", "/api/media/"]),
      disallow: expect.arrayContaining(["/api/", "/dashboard", "/projects/*/edit"]),
    });
  });
});
