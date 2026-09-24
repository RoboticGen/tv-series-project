// Exercises the real builder-points triggers from database/init/003_functions.sql
// against a real (PGlite) Postgres instance -- see docs comment in
// tests/setup/pglite-db.ts for why this is preferable to re-implementing
// the point math in JS and testing that instead.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
});

afterEach(async () => {
  await handle.close();
});

async function pointsOf(userId: string) {
  const [row] = await handle.db
    .select({ points: schema.users.points })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return row?.points ?? 0;
}

describe("submission_created points (+5)", () => {
  it("pays the submitter once for their first submission", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id);

    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: builder.id,
      contentDocId: "doc-1",
    });

    expect(await pointsOf(builder.id)).toBe(5);
  });

  it("does not pay twice for a second submission to the same project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id);

    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: builder.id,
      contentDocId: "doc-1",
    });
    // A second write-up attempt against the same project is allowed by the
    // schema (no unique constraint on submissions itself) but must not
    // farm a second award -- that's what uq_point_events_submission guards.
    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: builder.id,
      contentDocId: "doc-2",
    });

    expect(await pointsOf(builder.id)).toBe(5);
    const events = await db
      .select()
      .from(schema.pointEvents)
      .where(eq(schema.pointEvents.userId, builder.id));
    expect(events).toHaveLength(1);
  });

  it("does not pay the author for submitting to their own project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id);

    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: author.id,
      contentDocId: "doc-1",
    });

    expect(await pointsOf(author.id)).toBe(0);
  });

  it("pays independently per distinct project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const projectA = await insertProject(db, author.id, { slug: "a" });
    const projectB = await insertProject(db, author.id, { slug: "b" });

    await db
      .insert(schema.submissions)
      .values([
        { projectId: projectA.id, userId: builder.id, contentDocId: "doc-a" },
        { projectId: projectB.id, userId: builder.id, contentDocId: "doc-b" },
      ]);

    expect(await pointsOf(builder.id)).toBe(10);
  });
});

describe("project_featured points (+15)", () => {
  it("pays the author the first time their project is featured", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.id, project.id));

    expect(await pointsOf(author.id)).toBe(15);
  });

  it("does not pay again when un-featured and re-featured", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.id, project.id));
    await db
      .update(schema.projects)
      .set({ isFeatured: false })
      .where(eq(schema.projects.id, project.id));
    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.id, project.id));

    expect(await pointsOf(author.id)).toBe(15);
  });

  it("does not fire when other columns change without is_featured flipping to true", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db
      .update(schema.projects)
      .set({ title: "Renamed" })
      .where(eq(schema.projects.id, project.id));

    expect(await pointsOf(author.id)).toBe(0);
  });
});

describe("star_received points (+3)", () => {
  it("pays the author once per distinct starrer", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const starrerA = await insertUser(db);
    const starrerB = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db
      .insert(schema.projectStars)
      .values([
        { userId: starrerA.id, projectId: project.id },
        { userId: starrerB.id, projectId: project.id },
      ]);

    expect(await pointsOf(author.id)).toBe(6);
  });

  it("does not pay again for un-star/re-star (would otherwise let a user farm points)", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const starrer = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db.insert(schema.projectStars).values({ userId: starrer.id, projectId: project.id });
    await db
      .delete(schema.projectStars)
      .where(eq(schema.projectStars.userId, starrer.id));
    await db.insert(schema.projectStars).values({ userId: starrer.id, projectId: project.id });

    expect(await pointsOf(author.id)).toBe(3);
  });

  it("does not pay for self-starring your own project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db.insert(schema.projectStars).values({ userId: author.id, projectId: project.id });

    expect(await pointsOf(author.id)).toBe(0);
  });
});

describe("users.points denormalization", () => {
  it("matches the sum of the user's point_events after a mix of awards", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: builder.id,
      contentDocId: "doc-1",
    });
    await db.insert(schema.projectStars).values({ userId: builder.id, projectId: project.id });
    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.id, project.id));

    const events = await db
      .select()
      .from(schema.pointEvents)
      .where(eq(schema.pointEvents.userId, author.id));
    const authorTotal = events.reduce((sum, e) => sum + e.points, 0);

    expect(await pointsOf(author.id)).toBe(authorTotal);
    // author earns: +15 featured, +3 for the builder's star on their project
    expect(await pointsOf(author.id)).toBe(15 + 3);
    // builder earns: +5 for submitting, nothing for starring someone else's project
    expect(await pointsOf(builder.id)).toBe(5);
  });

  it("decrements when a point_events row is deleted directly (ledger integrity)", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.id, project.id));
    expect(await pointsOf(author.id)).toBe(15);

    await db.delete(schema.pointEvents).where(eq(schema.pointEvents.userId, author.id));

    expect(await pointsOf(author.id)).toBe(0);
  });
});
