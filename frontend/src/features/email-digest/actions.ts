"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth/session";

export async function setEmailPreference(kind: "digest" | "mentorDigest", enabled: boolean) {
  const userId = await requireUserId();
  if (kind !== "digest" && kind !== "mentorDigest") throw new Error("Unknown preference");
  await db
    .update(users)
    .set(kind === "digest" ? { emailDigest: enabled === true } : { emailMentorDigest: enabled === true })
    .where(eq(users.id, userId));
}
