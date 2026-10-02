"use server";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications, projects, users } from "@/db/schema";

const actors = alias(users, "actors");

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session.user.id;
}

// All of these read or change the signed-in user's own notifications only.
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
    // Builds are private: never reveal who built a project.
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

export async function getUnreadNotificationCount() {
  const userId = await requireUserId();
  const [row] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
  return row?.unread ?? 0;
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
}
