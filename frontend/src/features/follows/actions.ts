"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { follows } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";

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
