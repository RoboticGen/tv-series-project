import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth/session";

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
