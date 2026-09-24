import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { dbHolder, sessionHolder, type UserRole } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";
import { toggleFeatured, unpublishProject } from "@/actions/review";

let handle: TestDbHandle;

function signInAs(user: { id: string; role?: UserRole }) {
  sessionHolder.session = { user: { id: user.id, role: user.role ?? "student" } };
}

async function publishedProject(authorId: string, overrides = {}) {
  return insertProject(handle.db, authorId, {
    status: "published",
    publishedAt: new Date(),
    ...overrides,
  });
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
});

afterEach(async () => {
  await handle.close();
});

describe("role gate (requireReviewer)", () => {
  it("throws when not signed in", async () => {
    await expect(toggleFeatured("00000000-0000-0000-0000-000000000000")).rejects.toThrow(
      "Not signed in",
    );
  });

  it("refuses a student", async () => {
    const { db } = handle;
    const student = await insertUser(db, { role: "student" });
    const project = await publishedProject(student.id);
    signInAs(student);

    await expect(toggleFeatured(project.id)).rejects.toThrow(
      "Not authorized to moderate projects",
    );
  });

  it("allows a mentor", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const project = await publishedProject(author.id);
    signInAs(mentor);

    await expect(toggleFeatured(project.id)).resolves.toEqual({ isFeatured: true });
  });

  it("allows an admin", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const admin = await insertUser(db, { role: "admin" });
    const project = await publishedProject(author.id);
    signInAs(admin);

    await expect(toggleFeatured(project.id)).resolves.toEqual({ isFeatured: true });
  });
});

describe("toggleFeatured", () => {
  it("refuses to feature a project that isn't published", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const draft = await insertProject(db, author.id, { status: "draft" });
    signInAs(mentor);

    await expect(toggleFeatured(draft.id)).rejects.toThrow(
      "Only published projects can be featured",
    );
  });

  it("toggles on then off", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const project = await publishedProject(author.id);
    signInAs(mentor);

    expect(await toggleFeatured(project.id)).toEqual({ isFeatured: true });
    expect(await toggleFeatured(project.id)).toEqual({ isFeatured: false });
  });

  it("allows a reviewer to feature their own project", async () => {
    const { db } = handle;
    const mentor = await insertUser(db, { role: "mentor" });
    const ownProject = await publishedProject(mentor.id);
    signInAs(mentor);

    await expect(toggleFeatured(ownProject.id)).resolves.toEqual({ isFeatured: true });
  });
});

describe("unpublishProject", () => {
  it("rejects a reason shorter than 5 characters", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const project = await publishedProject(author.id);
    signInAs(mentor);

    await expect(unpublishProject(project.id, "bad")).rejects.toThrow(
      "Give a reason of at least 5 characters",
    );
  });

  it("refuses to unpublish a project that isn't currently published", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const draft = await insertProject(db, author.id, { status: "draft" });
    signInAs(mentor);

    await expect(unpublishProject(draft.id, "policy violation")).rejects.toThrow(
      "Only published projects can be unpublished",
    );
  });

  it("takes the project down, clears is_featured, and records the reviewer", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const mentor = await insertUser(db, { role: "mentor" });
    const project = await publishedProject(author.id, { isFeatured: true });
    signInAs(mentor);

    await unpublishProject(project.id, "Violates community guidelines");

    const [row] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(row.status).toBe("rejected");
    expect(row.isFeatured).toBe(false);
    expect(row.publishedAt).toBeNull();
    expect(row.reviewedById).toBe(mentor.id);
    expect(row.reviewedAt).not.toBeNull();
    expect(row.rejectionReason).toBe("Violates community guidelines");
  });
});
