"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userDashboardStats } from "@/db/schema";

export async function getDashboardStats(userId: string) {
  const [stats] = await db
    .select()
    .from(userDashboardStats)
    .where(eq(userDashboardStats.userId, userId));

  return {
    draftProjects: stats?.draftProjects ?? 0,
    pendingProjects: stats?.pendingProjects ?? 0,
    publishedProjects: stats?.publishedProjects ?? 0,
    rejectedProjects: stats?.rejectedProjects ?? 0,
    totalLikesReceived: stats?.totalLikesReceived ?? 0,
    totalStarsReceived: stats?.totalStarsReceived ?? 0,
    submissionsCount: stats?.submissionsCount ?? 0,
  };
}
