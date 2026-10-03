import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { dbHolder, sessionHolder } from "../../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../../setup/pglite-db";
import { getUnreadNotificationCount, markAllNotificationsRead } from "@/features/notifications/actions";
import { getMyNotifications } from "@/features/notifications/services/queries";

let handle: TestDbHandle;
let author: typeof schema.users.$inferSelect;
let fan: typeof schema.users.$inferSelect;
let mentor: typeof schema.users.$inferSelect;
let project: typeof schema.projects.$inferSelect;

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  author = await insertUser(handle.db, { displayName: "Author" });
  fan = await insertUser(handle.db, { displayName: "Fan" });
  mentor = await insertUser(handle.db, { role: "mentor" });
  project = await insertProject(handle.db, author.id, {
    status: "published",
    publishedAt: new Date(),
    reviewedById: mentor.id,
    reviewedAt: new Date(),
  });
  sessionHolder.session = { user: { id: author.id, role: "student" } };
});

afterEach(async () => {
  await handle.close();
});

function typesFor(userId: string) {
  return handle.db
    .select({ type: schema.notifications.type })
    .from(schema.notifications)
    .where(eq(schema.notifications.recipientId, userId))
    .then((rows) => rows.map((r) => r.type).sort());
}

function star(userId: string) {
  return handle.db.insert(schema.projectStars).values({ userId, projectId: project.id });
}

function build(userId: string) {
  return handle.db.insert(schema.submissions).values({ userId, projectId: project.id, contentDocId: "doc" });
}

function comment(userId: string, parentCommentId?: string) {
  return handle.db
    .insert(schema.comments)
    .values({ userId, projectId: project.id, body: "Nice!", parentCommentId })
    .returning()
    .then(([row]) => row);
}

describe("notification triggers", () => {
  it("notifies the author of a star, once, and never for a self-star", async () => {
    await star(author.id);
    await star(fan.id);
    await handle.db
      .delete(schema.projectStars)
      .where(and(eq(schema.projectStars.userId, fan.id), eq(schema.projectStars.projectId, project.id)));
    await star(fan.id);

    expect(await typesFor(author.id)).toEqual(["project_starred"]);
  });

  it("notifies the author when the project is featured", async () => {
    await handle.db.update(schema.projects).set({ isFeatured: true }).where(eq(schema.projects.id, project.id));

    expect(await typesFor(author.id)).toEqual(["project_featured"]);
  });

  it("notifies the author of a build once per builder, not for their own", async () => {
    await build(author.id);
    await build(fan.id);
    await build(fan.id);

    expect(await typesFor(author.id)).toEqual(["project_built"]);
  });

  it("notifies the author of comments and the commenter of replies", async () => {
    await comment(author.id);
    const fanComment = await comment(fan.id);
    await comment(author.id, fanComment.id);
    await comment(fan.id, fanComment.id);

    expect(await typesFor(author.id)).toEqual(["project_commented"]);
    expect(await typesFor(fan.id)).toEqual(["comment_replied"]);
  });

  it("notifies a new follower once across unfollow/refollow", async () => {
    const follow = () => handle.db.insert(schema.follows).values({ followerId: fan.id, followeeId: author.id });
    await follow();
    await handle.db.delete(schema.follows).where(eq(schema.follows.followerId, fan.id));
    await follow();

    expect(await typesFor(author.id)).toEqual(["new_follower"]);
  });

  it("notifies the author of a moderation takedown with the reason, not of their own unpublish", async () => {
    const other = await insertProject(handle.db, author.id, {
      status: "published",
      publishedAt: new Date(),
      reviewedById: mentor.id,
      reviewedAt: new Date(),
    });
    await handle.db
      .update(schema.projects)
      .set({ status: "draft", publishedAt: null })
      .where(eq(schema.projects.id, other.id));
    await handle.db
      .update(schema.projects)
      .set({ status: "rejected", publishedAt: null, rejectionReason: "Missing safety notes" })
      .where(eq(schema.projects.id, project.id));

    const [row, ...rest] = await getMyNotifications();
    expect(rest).toEqual([]);
    expect(row).toMatchObject({ type: "project_unpublished", detail: "Missing safety notes", projectViewable: true });
  });
});

describe("notification actions", () => {
  it("returns only the signed-in user's notifications and hides who built a project", async () => {
    await star(fan.id);
    await build(fan.id);

    const mine = await getMyNotifications();
    expect(mine.find((n) => n.type === "project_starred")).toMatchObject({ actorName: "Fan", points: 3 });
    expect(mine.find((n) => n.type === "project_built")).toMatchObject({ actorId: null, actorName: null });

    sessionHolder.session = { user: { id: fan.id, role: "student" } };
    expect(await getMyNotifications()).toEqual([]);
  });

  it("counts unread and marks only the signed-in user's as read", async () => {
    await star(fan.id);
    const fanComment = await comment(fan.id);
    await comment(author.id, fanComment.id);
    expect(await getUnreadNotificationCount()).toBe(2);

    await markAllNotificationsRead();
    expect(await getUnreadNotificationCount()).toBe(0);

    sessionHolder.session = { user: { id: fan.id, role: "student" } };
    expect(await getUnreadNotificationCount()).toBe(1);
  });

  it("requires a session", async () => {
    sessionHolder.session = null;
    await expect(getMyNotifications()).rejects.toThrow("Not signed in");
    await expect(getUnreadNotificationCount()).rejects.toThrow("Not signed in");
    await expect(markAllNotificationsRead()).rejects.toThrow("Not signed in");
  });
});
