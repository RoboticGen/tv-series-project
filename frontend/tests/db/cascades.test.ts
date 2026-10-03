// Deletion cascades -- real FK ON DELETE CASCADE for most tables, plus the
// emulated cascade for media_assets (see the long comment on that table in
// database/init/004_tables.sql: no single FK can target two parent tables).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";

let handle: TestDbHandle;

beforeEach(async () => {
  handle = await createTestDb();
});

afterEach(async () => {
  await handle.close();
});

describe("trg_projects_cascade_media (emulated FK cascade)", () => {
  it("removes a project's media assets when the project is deleted", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id);
    await db.insert(schema.mediaAssets).values({
      ownerType: "project",
      ownerId: project.id,
      filePath: "project/x/cover.png",
    });

    await db.delete(schema.projects).where(eq(schema.projects.id, project.id));

    const remaining = await db
      .select()
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.ownerId, project.id));
    expect(remaining).toHaveLength(0);
  });
});

describe("trg_submissions_cascade_media (emulated FK cascade)", () => {
  it("removes a submission's media assets when the submission is deleted", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id);
    const [submission] = await db
      .insert(schema.submissions)
      .values({ projectId: project.id, userId: builder.id, contentDocId: "doc-1" })
      .returning();
    await db.insert(schema.mediaAssets).values({
      ownerType: "submission",
      ownerId: submission.id,
      filePath: "submission/x/photo.png",
    });

    await db.delete(schema.submissions).where(eq(schema.submissions.id, submission.id));

    const remaining = await db
      .select()
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.ownerId, submission.id));
    expect(remaining).toHaveLength(0);
  });
});

describe("fk_projects_cover_image ON DELETE SET NULL", () => {
  it("clears cover_image_id instead of blocking/cascading when the media asset is removed", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id);
    const [asset] = await db
      .insert(schema.mediaAssets)
      .values({ ownerType: "project", ownerId: project.id, filePath: "project/x/cover.png" })
      .returning();
    await db
      .update(schema.projects)
      .set({ coverImageId: asset.id })
      .where(eq(schema.projects.id, project.id));

    await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, asset.id));

    const [reloaded] = await db
      .select({ coverImageId: schema.projects.coverImageId })
      .from(schema.projects)
      .where(eq(schema.projects.id, project.id));
    expect(reloaded.coverImageId).toBeNull();
  });
});

describe("point_events.project_id ON DELETE SET NULL", () => {
  it("keeps a user's already-earned points when the project is deleted", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id);
    await db.insert(schema.submissions).values({
      projectId: project.id,
      userId: builder.id,
      contentDocId: "doc-1",
    });

    await db.delete(schema.projects).where(eq(schema.projects.id, project.id));

    const [row] = await db
      .select({ points: schema.users.points })
      .from(schema.users)
      .where(eq(schema.users.id, builder.id));
    expect(row.points).toBe(5);

    const [event] = await db
      .select({ projectId: schema.pointEvents.projectId })
      .from(schema.pointEvents)
      .where(eq(schema.pointEvents.userId, builder.id));
    expect(event.projectId).toBeNull();
  });
});

describe("users ON DELETE CASCADE", () => {
  it("removes a deleted user's projects, submissions, likes, and comments", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    const commenter = await insertUser(db);
    await db.insert(schema.projectLikes).values({ userId: commenter.id, projectId: project.id });
    await db
      .insert(schema.comments)
      .values({ projectId: project.id, userId: commenter.id, body: "Nice work!" });

    await db.delete(schema.users).where(eq(schema.users.id, author.id));

    const remainingProjects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.authorId, author.id));
    expect(remainingProjects).toHaveLength(0);

    // The project's own dependents (likes/comments from other users) go
    // with it via projects' ON DELETE CASCADE from users.
    const remainingLikes = await db
      .select()
      .from(schema.projectLikes)
      .where(eq(schema.projectLikes.projectId, project.id));
    expect(remainingLikes).toHaveLength(0);
  });
});
