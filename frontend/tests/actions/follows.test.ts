import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbHolder, sessionHolder } from "../setup/global-mocks";
import { createTestDb, insertUser, type TestDbHandle } from "../setup/pglite-db";
import { getFollowStatus, toggleFollow } from "@/actions/follows";

let handle: TestDbHandle;

function signInAs(user: { id: string }) {
  sessionHolder.session = { user: { id: user.id, role: "student" } };
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
});

afterEach(async () => {
  await handle.close();
});

describe("toggleFollow", () => {
  it("throws when not signed in", async () => {
    await expect(toggleFollow("00000000-0000-0000-0000-000000000000")).rejects.toThrow(
      "Not signed in",
    );
  });

  it("refuses to let a user follow themselves", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    signInAs(user);

    await expect(toggleFollow(user.id)).rejects.toThrow("Cannot follow yourself");
  });

  it("follows on first call and unfollows on the second (toggle)", async () => {
    const { db } = handle;
    const follower = await insertUser(db);
    const followee = await insertUser(db);
    signInAs(follower);

    const first = await toggleFollow(followee.id);
    expect(first).toEqual({ following: true });
    expect((await getFollowStatus(followee.id, follower.id)).viewerIsFollowing).toBe(true);

    const second = await toggleFollow(followee.id);
    expect(second).toEqual({ following: false });
    expect((await getFollowStatus(followee.id, follower.id)).viewerIsFollowing).toBe(false);
  });
});

describe("getFollowStatus", () => {
  it("reports counts and viewer status without requiring the viewer to be signed in", async () => {
    const { db } = handle;
    const follower = await insertUser(db);
    const followee = await insertUser(db);
    signInAs(follower);
    await toggleFollow(followee.id);

    const asAnonymous = await getFollowStatus(followee.id);
    expect(asAnonymous.followerCount).toBe(1);
    expect(asAnonymous.viewerIsFollowing).toBe(false);

    const asFollower = await getFollowStatus(followee.id, follower.id);
    expect(asFollower.viewerIsFollowing).toBe(true);
  });
});
