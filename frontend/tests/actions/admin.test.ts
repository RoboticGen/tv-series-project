import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { dbHolder, sessionHolder, type UserRole } from "../setup/global-mocks";
import { createTestDb, insertUser, type TestDbHandle } from "../setup/pglite-db";
import { deleteUser, listUsersForAdmin, setUserDisabled, updateUserRole } from "@/actions/admin";

let handle: TestDbHandle;
const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function signInAs(user: { id: string; role?: UserRole }) {
  sessionHolder.session = { user: { id: user.id, role: user.role ?? "student" } };
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
  process.env.ADMIN_EMAIL = "root@example.com";
});

afterEach(async () => {
  await handle.close();
  process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
});

describe("role gate (requireAdmin)", () => {
  it("throws when not signed in", async () => {
    await expect(listUsersForAdmin()).rejects.toThrow("Not signed in");
  });

  it("refuses a student", async () => {
    const { db } = handle;
    const student = await insertUser(db, { role: "student" });
    signInAs(student);

    await expect(listUsersForAdmin()).rejects.toThrow("Not authorized to manage users");
  });

  it("refuses a mentor (only admin may manage users)", async () => {
    const { db } = handle;
    const mentor = await insertUser(db, { role: "mentor" });
    signInAs(mentor);

    await expect(listUsersForAdmin()).rejects.toThrow("Not authorized to manage users");
  });

  it("allows an admin", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    signInAs(admin);

    await expect(listUsersForAdmin()).resolves.toBeInstanceOf(Array);
  });
});

describe("getManageableUser guardrails", () => {
  it("refuses to let an admin act on their own account", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    signInAs(admin);

    await expect(updateUserRole(admin.id, "mentor")).rejects.toThrow(
      "You can't change your own account here",
    );
  });

  it("refuses to act on the bootstrap ADMIN_EMAIL account, even by a different admin", async () => {
    const { db } = handle;
    const defaultAdmin = await insertUser(db, { role: "admin", email: "root@example.com" });
    const otherAdmin = await insertUser(db, { role: "admin" });
    signInAs(otherAdmin);

    await expect(setUserDisabled(defaultAdmin.id, true)).rejects.toThrow(
      "The default admin account can't be changed",
    );
  });

  it("throws for a user id that doesn't exist", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    signInAs(admin);

    await expect(
      updateUserRole("00000000-0000-0000-0000-000000000000", "mentor"),
    ).rejects.toThrow("User not found");
  });
});

describe("updateUserRole", () => {
  it("rejects a role outside the fixed enum", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    const target = await insertUser(db, { role: "student" });
    signInAs(admin);

    // @ts-expect-error -- intentionally passing an invalid role
    await expect(updateUserRole(target.id, "superadmin")).rejects.toThrow("Invalid role");
  });

  it("promotes a student to mentor", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    const target = await insertUser(db, { role: "student" });
    signInAs(admin);

    await updateUserRole(target.id, "mentor");

    const [reloaded] = await db.select().from(schema.users).where(eq(schema.users.id, target.id));
    expect(reloaded.role).toBe("mentor");
  });
});

describe("setUserDisabled", () => {
  it("disables and re-enables a user", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    const target = await insertUser(db, { role: "student" });
    signInAs(admin);

    await setUserDisabled(target.id, true);
    let [reloaded] = await db.select().from(schema.users).where(eq(schema.users.id, target.id));
    expect(reloaded.isDisabled).toBe(true);

    await setUserDisabled(target.id, false);
    [reloaded] = await db.select().from(schema.users).where(eq(schema.users.id, target.id));
    expect(reloaded.isDisabled).toBe(false);
  });
});

describe("deleteUser", () => {
  it("removes the user row (and, per FK cascade, everything they own)", async () => {
    const { db } = handle;
    const admin = await insertUser(db, { role: "admin" });
    const target = await insertUser(db, { role: "student" });
    signInAs(admin);

    await deleteUser(target.id);

    const remaining = await db.select().from(schema.users).where(eq(schema.users.id, target.id));
    expect(remaining).toHaveLength(0);
  });
});
