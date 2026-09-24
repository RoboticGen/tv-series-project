"use server";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { mediaAssets, projects, submissions, users } from "@/db/schema";
import { deleteContentDoc } from "@/db/content";
import { deleteUploadedFile } from "@/lib/storage";
import { isDefaultAdmin } from "@/lib/admin";

type UserRole = (typeof users.role.enumValues)[number];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "admin") {
    throw new Error("Not authorized to manage users");
  }
  return session;
}

// Loads the target and refuses changes that would lock the platform out:
// admins can't act on their own account, and the ADMIN_EMAIL account is
// untouchable so there is always at least one admin.
async function getManageableUser(userId: string) {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    throw new Error("You can't change your own account here");
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) throw new Error("User not found");
  if (isDefaultAdmin(user.email)) {
    throw new Error("The default admin account can't be changed");
  }
  return user;
}

export async function listUsersForAdmin() {
  await requireAdmin();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      isDisabled: users.isDisabled,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return rows.map((row) => ({ ...row, isDefaultAdmin: isDefaultAdmin(row.email) }));
}

export async function updateUserRole(userId: string, role: UserRole) {
  if (!users.role.enumValues.includes(role)) throw new Error("Invalid role");
  await getManageableUser(userId);

  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/dashboard/admin");
}

export async function setUserDisabled(userId: string, isDisabled: boolean) {
  await getManageableUser(userId);

  await db.update(users).set({ isDisabled }).where(eq(users.id, userId));
  revalidatePath("/dashboard/admin");
}

export async function deleteUser(userId: string) {
  await getManageableUser(userId);

  // Postgres cascades everything the user owns (projects -> their
  // submissions/likes/stars/media rows, the user's own submissions,
  // comments, follows, collections). The Mongo bodies and files on disk
  // behind those rows aren't Postgres's problem -- collect them first,
  // same as deleteProject does for a single project.
  const ownedProjects = await db
    .select({ id: projects.id, contentDocId: projects.contentDocId })
    .from(projects)
    .where(eq(projects.authorId, userId));
  const projectIds = ownedProjects.map((p) => p.id);

  const doomedSubmissions = await db
    .select({ id: submissions.id, contentDocId: submissions.contentDocId })
    .from(submissions)
    .where(
      projectIds.length > 0
        ? or(eq(submissions.userId, userId), inArray(submissions.projectId, projectIds))
        : eq(submissions.userId, userId),
    );
  const submissionIds = doomedSubmissions.map((s) => s.id);

  const ownerFilters = [
    projectIds.length > 0
      ? and(eq(mediaAssets.ownerType, "project"), inArray(mediaAssets.ownerId, projectIds))
      : undefined,
    submissionIds.length > 0
      ? and(eq(mediaAssets.ownerType, "submission"), inArray(mediaAssets.ownerId, submissionIds))
      : undefined,
  ].filter((f) => f !== undefined);
  const assets =
    ownerFilters.length > 0
      ? await db
          .select({ filePath: mediaAssets.filePath })
          .from(mediaAssets)
          .where(or(...ownerFilters))
      : [];

  await Promise.all(assets.map((a) => deleteUploadedFile(a.filePath)));
  await Promise.all(
    [...ownedProjects, ...doomedSubmissions].map((row) => deleteContentDoc(row.contentDocId)),
  );
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/dashboard/admin");
  revalidatePath("/projects");
}
