import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { follows, users } from "@/lib/db/schema";

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
