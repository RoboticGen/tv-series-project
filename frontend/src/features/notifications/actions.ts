"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth/session";

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
