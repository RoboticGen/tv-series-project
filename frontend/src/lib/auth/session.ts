import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

export async function requireUserId() {
  return (await requireSession()).user.id;
}

// Mentors and admins.
export async function requireReviewer() {
  const session = await requireSession();
  if (!isStaff(session.user.role)) throw new Error("Not authorized to moderate projects");
  return session;
}

export function isStaff(role: string | undefined) {
  return role === "mentor" || role === "admin";
}
