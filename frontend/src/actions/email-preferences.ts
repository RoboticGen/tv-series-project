"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session.user.id;
}

export async function getEmailPreferences() {
  const userId = await requireUserId();
  const [row] = await db
    .select({ emailDigest: users.emailDigest, emailMentorDigest: users.emailMentorDigest, role: users.role })
    .from(users)
    .where(eq(users.id, userId));
  if (!row) throw new Error("User not found");
  return {
    emailDigest: row.emailDigest,
    emailMentorDigest: row.emailMentorDigest,
    isStaff: row.role === "mentor" || row.role === "admin",
  };
}

export async function setEmailPreference(kind: "digest" | "mentorDigest", enabled: boolean) {
  const userId = await requireUserId();
  if (kind !== "digest" && kind !== "mentorDigest") throw new Error("Unknown preference");
  await db
    .update(users)
    .set(kind === "digest" ? { emailDigest: enabled === true } : { emailMentorDigest: enabled === true })
    .where(eq(users.id, userId));
}
