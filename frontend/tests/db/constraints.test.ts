// CHECK constraints and other invariants declared in database/init/004_tables.sql
// that the app relies on the DB to enforce, rather than re-checking in JS.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
});

afterEach(async () => {
  await handle.close();
});

describe("chk_follows_no_self_follow", () => {
  it("rejects a user following themselves", async () => {
    const { db } = handle;
    const user = await insertUser(db);

    await expect(
      db.insert(schema.follows).values({ followerId: user.id, followeeId: user.id }),
    ).rejects.toThrow();
  });

  it("allows following a different user", async () => {
    const { db } = handle;
    const a = await insertUser(db);
    const b = await insertUser(db);

    await expect(
      db.insert(schema.follows).values({ followerId: a.id, followeeId: b.id }),
    ).resolves.not.toThrow();
  });
});

describe("chk_comments_body_not_blank", () => {
  it("rejects an all-space comment body", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    const project = await insertProject(db, user.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await expect(
      db.insert(schema.comments).values({
        projectId: project.id,
        userId: user.id,
        body: "     ",
      }),
    ).rejects.toThrow();
  });

  // NOT a bug fix target, just documenting real behavior: Postgres's
  // single-argument trim() strips only spaces, not tabs/newlines, so a
  // tab/newline-only body slips past this CHECK constraint at the DB
  // layer. addComment is still safe because createCommentSchema's Zod
  // `.trim().min(1)` (which treats all whitespace as blank) runs first
  // and rejects it before the insert -- this constraint is a backstop,
  // not the only guard, and this test is what proves that division of
  // labor is load-bearing.
  it("does NOT reject a tab/newline-only body -- app-layer validation must catch this", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    const project = await insertProject(db, user.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await expect(
      db.insert(schema.comments).values({
        projectId: project.id,
        userId: user.id,
        body: "\t\n",
      }),
    ).resolves.not.toThrow();
  });

  it("accepts a non-blank body", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    const project = await insertProject(db, user.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await expect(
      db.insert(schema.comments).values({
        projectId: project.id,
        userId: user.id,
        body: "Nice build!",
      }),
    ).resolves.not.toThrow();
  });
});

describe("chk_projects_published_at", () => {
  it("rejects status = published with no published_at", async () => {
    const { db } = handle;
    const user = await insertUser(db);

    await expect(
      insertProject(db, user.id, { status: "published", publishedAt: null }),
    ).rejects.toThrow();
  });

  it("rejects a non-published status that does carry published_at", async () => {
    const { db } = handle;
    const user = await insertUser(db);

    await expect(
      insertProject(db, user.id, { status: "draft", publishedAt: new Date() }),
    ).rejects.toThrow();
  });

  it("accepts published + published_at together", async () => {
    const { db } = handle;
    const user = await insertUser(db);

    await expect(
      insertProject(db, user.id, { status: "published", publishedAt: new Date() }),
    ).resolves.not.toThrow();
  });
});

describe("chk_projects_review_fields", () => {
  it("rejects status = rejected with no reviewed_by/reviewed_at", async () => {
    const { db } = handle;
    const user = await insertUser(db);

    await expect(insertProject(db, user.id, { status: "rejected" })).rejects.toThrow();
  });

  it("accepts status = rejected when reviewed_by and reviewed_at are both set", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const reviewer = await insertUser(db, { role: "admin" });

    await expect(
      insertProject(db, author.id, {
        status: "rejected",
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        rejectionReason: "policy violation",
      }),
    ).resolves.not.toThrow();
  });
});

describe("media_assets owner validation (validate_media_asset_owner trigger)", () => {
  it("rejects a project-owned media asset pointing at a nonexistent project id", async () => {
    const { db } = handle;

    await expect(
      db.insert(schema.mediaAssets).values({
        ownerType: "project",
        ownerId: "00000000-0000-0000-0000-000000000000",
        filePath: "project/ghost/file.png",
      }),
    ).rejects.toThrow();
  });

  it("accepts a media asset pointing at a real project", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    const project = await insertProject(db, user.id);

    await expect(
      db.insert(schema.mediaAssets).values({
        ownerType: "project",
        ownerId: project.id,
        filePath: "project/real/file.png",
      }),
    ).resolves.not.toThrow();
  });
});

describe("uniqueness constraints", () => {
  it("rejects two users with the same google_id", async () => {
    const { db } = handle;
    await insertUser(db, { googleId: "dup-google-id" });

    await expect(insertUser(db, { googleId: "dup-google-id" })).rejects.toThrow();
  });

  it("rejects two users with the same email regardless of case (CITEXT)", async () => {
    const { db } = handle;
    await insertUser(db, { email: "Someone@Example.com" });

    await expect(insertUser(db, { email: "someone@example.com" })).rejects.toThrow();
  });

  it("rejects two projects with the same slug", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    await insertProject(db, user.id, { slug: "dup-slug" });

    await expect(insertProject(db, user.id, { slug: "dup-slug" })).rejects.toThrow();
  });
});
