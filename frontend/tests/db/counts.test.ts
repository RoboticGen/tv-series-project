// Denormalized counter columns maintained by triggers in
// database/init/003_functions.sql -- the app never writes these directly
// (see the "do not write from app code" comments on each column in
// src/db/schema.ts), so the only thing that can keep them honest is the
// trigger, which is what's under test here.
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

async function projectCounts(projectId: string) {
  const [row] = await handle.db
    .select({
      likeCount: schema.projects.likeCount,
      starCount: schema.projects.starCount,
      commentCount: schema.projects.commentCount,
    })
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId));
  return row;
}

describe("project_likes -> projects.like_count", () => {
  it("increments on like and decrements on unlike", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const liker = await insertUser(db);
    const project = await insertProject(db, author.id);

    await db.insert(schema.projectLikes).values({ userId: liker.id, projectId: project.id });
    expect((await projectCounts(project.id))?.likeCount).toBe(1);

    await db
      .delete(schema.projectLikes)
      .where(eq(schema.projectLikes.userId, liker.id));
    expect((await projectCounts(project.id))?.likeCount).toBe(0);
  });
});

describe("project_stars -> projects.star_count", () => {
  it("increments on star and decrements on unstar", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const starrer = await insertUser(db);
    const project = await insertProject(db, author.id);

    await db.insert(schema.projectStars).values({ userId: starrer.id, projectId: project.id });
    expect((await projectCounts(project.id))?.starCount).toBe(1);

    await db
      .delete(schema.projectStars)
      .where(eq(schema.projectStars.userId, starrer.id));
    expect((await projectCounts(project.id))?.starCount).toBe(0);
  });
});

describe("comments -> projects.comment_count", () => {
  it("increments on insert and decrements when deleted (including cascaded reply deletes)", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const commenter = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });

    const [top] = await db
      .insert(schema.comments)
      .values({ projectId: project.id, userId: commenter.id, body: "Nice!" })
      .returning();
    const [reply] = await db
      .insert(schema.comments)
      .values({
        projectId: project.id,
        userId: author.id,
        parentCommentId: top.id,
        body: "Thanks!",
      })
      .returning();

    expect((await projectCounts(project.id))?.commentCount).toBe(2);

    // Deleting the parent cascades to the reply (ON DELETE CASCADE); the
    // trigger must fire for both rows, not just the one DELETE statement.
    await db.delete(schema.comments).where(eq(schema.comments.id, top.id));

    expect((await projectCounts(project.id))?.commentCount).toBe(0);
    const remaining = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.id, reply.id));
    expect(remaining).toHaveLength(0);
  });
});

describe("collection_items -> collections.item_count", () => {
  it("increments on add and decrements on remove", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id);
    const [collection] = await db
      .insert(schema.collections)
      .values({ ownerId: owner.id, title: "My Collection", slug: "my-collection" })
      .returning();

    await db
      .insert(schema.collectionItems)
      .values({ collectionId: collection.id, projectId: project.id });

    const [afterAdd] = await db
      .select({ itemCount: schema.collections.itemCount })
      .from(schema.collections)
      .where(eq(schema.collections.id, collection.id));
    expect(afterAdd.itemCount).toBe(1);

    await db
      .delete(schema.collectionItems)
      .where(eq(schema.collectionItems.collectionId, collection.id));

    const [afterRemove] = await db
      .select({ itemCount: schema.collections.itemCount })
      .from(schema.collections)
      .where(eq(schema.collections.id, collection.id));
    expect(afterRemove.itemCount).toBe(0);
  });
});

describe("follows -> users.follower_count / following_count", () => {
  it("updates both sides of the edge on follow and unfollow", async () => {
    const { db } = handle;
    const follower = await insertUser(db);
    const followee = await insertUser(db);

    await db.insert(schema.follows).values({ followerId: follower.id, followeeId: followee.id });

    const [followerRow] = await db
      .select({ followingCount: schema.users.followingCount })
      .from(schema.users)
      .where(eq(schema.users.id, follower.id));
    const [followeeRow] = await db
      .select({ followerCount: schema.users.followerCount })
      .from(schema.users)
      .where(eq(schema.users.id, followee.id));
    expect(followerRow.followingCount).toBe(1);
    expect(followeeRow.followerCount).toBe(1);

    await db
      .delete(schema.follows)
      .where(eq(schema.follows.followerId, follower.id));

    const [followerRowAfter] = await db
      .select({ followingCount: schema.users.followingCount })
      .from(schema.users)
      .where(eq(schema.users.id, follower.id));
    const [followeeRowAfter] = await db
      .select({ followerCount: schema.users.followerCount })
      .from(schema.users)
      .where(eq(schema.users.id, followee.id));
    expect(followerRowAfter.followingCount).toBe(0);
    expect(followeeRowAfter.followerCount).toBe(0);
  });
});
