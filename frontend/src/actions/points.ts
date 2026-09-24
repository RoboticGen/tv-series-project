"use server";

import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/auth";
import { db } from "@/db";
import { pointEvents, projects, users } from "@/db/schema";

const actors = alias(users, "actors");

export type PointValues = {
  submission_created: number;
  project_featured: number;
  star_received: number;
};

// What each action is worth, read from points_for() -- the same function the
// award triggers use -- so the numbers shown in the UI can't drift from what
// is actually paid. Public data, so no auth check.
export async function getPointValues(): Promise<PointValues> {
  const [row] = await db.execute<Record<keyof PointValues, number>>(sql`
    SELECT
      points_for('submission_created') AS submission_created,
      points_for('project_featured')   AS project_featured,
      points_for('star_received')      AS star_received
  `);
  return {
    submission_created: Number(row.submission_created),
    project_featured: Number(row.project_featured),
    star_received: Number(row.star_received),
  };
}

// Reads the signed-in user's own points only -- takes no userId, so this
// server action can't be called to read someone else's.
export async function getMyPoints(recentLimit = 5) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const userId = session.user.id;

  const [[user], recent] = await Promise.all([
    db.select({ points: users.points }).from(users).where(eq(users.id, userId)),
    db
      .select({
        id: pointEvents.id,
        reason: pointEvents.reason,
        points: pointEvents.points,
        createdAt: pointEvents.createdAt,
        projectTitle: projects.title,
        projectSlug: projects.slug,
        projectStatus: projects.status,
        actorName: actors.displayName,
      })
      .from(pointEvents)
      .leftJoin(projects, eq(pointEvents.projectId, projects.id))
      .leftJoin(actors, eq(pointEvents.actorId, actors.id))
      .where(eq(pointEvents.userId, userId))
      .orderBy(desc(pointEvents.createdAt))
      .limit(Math.min(Math.max(recentLimit, 1), 20)),
  ]);

  return { total: user?.points ?? 0, recent };
}

export type RecentPointEvent = Awaited<ReturnType<typeof getMyPoints>>["recent"][number];
