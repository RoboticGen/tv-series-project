import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { dbHolder, sessionHolder, type UserRole } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";
import {
  deleteProject,
  publishProject,
  toggleLike,
  toggleStar,
  updateProject,
} from "@/actions/projects";
import { deleteContentDoc } from "@/db/content";
import { deleteUploadedFile } from "@/lib/storage";

let handle: TestDbHandle;

function signInAs(user: { id: string; role?: UserRole }) {
  sessionHolder.session = { user: { id: user.id, role: user.role ?? "student" } };
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
});

afterEach(async () => {
  await handle.close();
});

describe("updateProject ownership", () => {
  it("refuses to let another user edit the project", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, owner.id);
    signInAs(stranger);

    await expect(
      updateProject(project.id, {
        title: "Hijacked Title",
        summary: "a".repeat(15),
        category: "robotics",
        body: "a".repeat(25),
      }),
    ).rejects.toThrow("Not authorized to edit this project");
  });

  it("lets the owner edit their own project", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id);
    signInAs(owner);

    await updateProject(project.id, {
      title: "New Title",
      summary: "a".repeat(15),
      category: "robotics",
      body: "a".repeat(25),
    });

    const [reloaded] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(reloaded.title).toBe("New Title");
  });
});

describe("publishProject", () => {
  it("refuses a non-owner", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, owner.id, { status: "draft" });
    signInAs(stranger);

    await expect(publishProject(project.id)).rejects.toThrow(
      "Not authorized to publish this project",
    );
  });

  it("publishes a draft project", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id, { status: "draft" });
    signInAs(owner);

    await publishProject(project.id);

    const [reloaded] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(reloaded.status).toBe("published");
    expect(reloaded.publishedAt).not.toBeNull();
  });

  it("re-publishes a rejected (moderated) project and clears the takedown fields", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const reviewer = await insertUser(db, { role: "mentor" });
    const project = await insertProject(db, owner.id, {
      status: "rejected",
      reviewedById: reviewer.id,
      reviewedAt: new Date(),
      rejectionReason: "policy violation",
    });
    signInAs(owner);

    await publishProject(project.id);

    const [reloaded] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(reloaded.status).toBe("published");
    expect(reloaded.rejectionReason).toBeNull();
    expect(reloaded.reviewedById).toBeNull();
    expect(reloaded.reviewedAt).toBeNull();
  });

  it("refuses to re-publish an already-published project", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(owner);

    await expect(publishProject(project.id)).rejects.toThrow(
      "Only draft or unpublished projects can be published",
    );
  });
});

describe("deleteProject ownership", () => {
  it("refuses a non-owner", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, owner.id);
    signInAs(stranger);

    await expect(deleteProject(project.id)).rejects.toThrow(
      "Not authorized to delete this project",
    );
    const stillThere = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(stillThere).toHaveLength(1);
  });

  it("lets the owner delete their own project", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id);
    signInAs(owner);

    await deleteProject(project.id);

    const remaining = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(remaining).toHaveLength(0);
  });

  it("removes the S3 images and Mongo docs of the project and its submissions", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, owner.id, { contentDocId: "project-doc" });
    const [submission] = await db
      .insert(schema.submissions)
      .values({ projectId: project.id, userId: builder.id, contentDocId: "submission-doc" })
      .returning();
    await db.insert(schema.mediaAssets).values([
      { ownerType: "project", ownerId: project.id, filePath: `project/${project.id}/a.png` },
      { ownerType: "submission", ownerId: submission.id, filePath: `submission/${submission.id}/b.png` },
    ]);
    const unrelated = await insertProject(db, owner.id);
    await db.insert(schema.mediaAssets).values({
      ownerType: "project",
      ownerId: unrelated.id,
      filePath: `project/${unrelated.id}/keep.png`,
    });
    vi.mocked(deleteUploadedFile).mockClear();
    vi.mocked(deleteContentDoc).mockClear();
    signInAs(owner);

    await deleteProject(project.id);

    expect(vi.mocked(deleteUploadedFile).mock.calls.map(([key]) => key).sort()).toEqual(
      [`project/${project.id}/a.png`, `submission/${submission.id}/b.png`].sort(),
    );
    expect(vi.mocked(deleteContentDoc).mock.calls.map(([id]) => id).sort()).toEqual([
      "project-doc",
      "submission-doc",
    ]);
    const remainingAssets = await db.select().from(schema.mediaAssets);
    expect(remainingAssets.map((a) => a.ownerId)).toEqual([unrelated.id]);
  });
});

describe("toggleLike / toggleStar", () => {
  it("toggles a like on then off and reports the resulting state", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const liker = await insertUser(db);
    const project = await insertProject(db, author.id);
    signInAs(liker);

    expect(await toggleLike(project.id)).toEqual({ liked: true });
    expect(await toggleLike(project.id)).toEqual({ liked: false });
  });

  it("toggles a star on then off and reports the resulting state", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const starrer = await insertUser(db);
    const project = await insertProject(db, author.id);
    signInAs(starrer);

    expect(await toggleStar(project.id)).toEqual({ starred: true });
    expect(await toggleStar(project.id)).toEqual({ starred: false });
  });

  it("requires sign-in", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id);

    await expect(toggleLike(project.id)).rejects.toThrow("Not signed in");
    await expect(toggleStar(project.id)).rejects.toThrow("Not signed in");
  });
});
