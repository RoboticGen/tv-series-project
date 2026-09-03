"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { follows, users } from "@/db/schema";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

export async function toggleFollow(userId: string) {
  const session = await requireSession();
  const followerId = session.user.id;
  if (followerId === userId) throw new Error("Cannot follow yourself");

  const [existing] = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, userId)));

  if (existing) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, userId)));
  } else {
    await db.insert(follows).values({ followerId, followeeId: userId });
  }

  revalidatePath(`/authors/${userId}`);

  return { following: !existing };
}

export async function getFollowStatus(userId: string, viewerId?: string) {
  const [user] = await db
    .select({ followerCount: users.followerCount, followingCount: users.followingCount })
    .from(users)
    .where(eq(users.id, userId));

  let viewerIsFollowing = false;
  if (viewerId) {
    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, userId)));
    viewerIsFollowing = Boolean(existing);
  }

  return {
    followerCount: user?.followerCount ?? 0,
    followingCount: user?.followingCount ?? 0,
    viewerIsFollowing,
  };
}
