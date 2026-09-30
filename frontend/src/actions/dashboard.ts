"use server";

import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, userDashboardStats } from "@/db/schema";
import { untouchedDraft } from "@/db/untouched-draft";

export async function getDashboardStats(userId: string) {
  const [[stats], [untouched]] = await Promise.all([
    db
      .select()
      .from(userDashboardStats)
      .where(eq(userDashboardStats.userId, userId)),
    // The view counts every draft; don't count the empty one left by an
    // abandoned "New project" -- it's hidden from the dashboard list too.
    db
      .select({ n: count() })
      .from(projects)
      .where(and(eq(projects.authorId, userId), untouchedDraft)),
  ]);

  return {
    draftProjects: Math.max(0, (stats?.draftProjects ?? 0) - (untouched?.n ?? 0)),
    pendingProjects: stats?.pendingProjects ?? 0,
    publishedProjects: stats?.publishedProjects ?? 0,
    featuredProjects: stats?.featuredProjects ?? 0,
    rejectedProjects: stats?.rejectedProjects ?? 0,
    totalLikesReceived: stats?.totalLikesReceived ?? 0,
    totalStarsReceived: stats?.totalStarsReceived ?? 0,
    submissionsCount: stats?.submissionsCount ?? 0,
  };
}
