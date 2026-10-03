import "server-only";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { notifications, projects, users } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth/session";

const actors = alias(users, "actors");

export async function getMyNotifications(limit = 50) {
  const userId = await requireUserId();

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      points: notifications.points,
      detail: notifications.detail,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorId: actors.id,
      actorName: actors.displayName,
      projectTitle: projects.title,
      projectSlug: projects.slug,
      projectStatus: projects.status,
      projectAuthorId: projects.authorId,
    })
    .from(notifications)
    .leftJoin(projects, eq(notifications.projectId, projects.id))
    .leftJoin(actors, eq(notifications.actorId, actors.id))
    .where(eq(notifications.recipientId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map(({ projectAuthorId, ...row }) => {
    const hideActor = row.type === "project_built";
    return {
      ...row,
      actorId: hideActor ? null : row.actorId,
      actorName: hideActor ? null : row.actorName,
      projectViewable: row.projectStatus === "published" || projectAuthorId === userId,
    };
  });
}

export type MyNotification = Awaited<ReturnType<typeof getMyNotifications>>[number];
