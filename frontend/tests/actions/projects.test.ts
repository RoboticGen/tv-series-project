import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { dbHolder, sessionHolder, type UserRole } from "../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../setup/pglite-db";
import {
  createDraftProjectRecord,
  deleteProject,
  getMyProjects,
  publishProject,
  revertProjectToDraft,
  toggleLike,
  toggleStar,
  updateProject,
} from "@/actions/projects";

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
        steps: [{ id: "s1", title: "", images: [], body: "a".repeat(25) }],
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
      steps: [{ id: "s1", title: "", images: [], body: "a".repeat(25) }],
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

describe("revertProjectToDraft", () => {
  it("refuses a non-owner", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(stranger);

    await expect(revertProjectToDraft(project.id)).rejects.toThrow(
      "Not authorized to unpublish this project",
    );
  });

  it("reverts a published project to draft and clears featured/publishedAt", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
    });
    signInAs(owner);

    await revertProjectToDraft(project.id);

    const [reloaded] = await db.select().from(schema.projects).where(eq(schema.projects.id, project.id));
    expect(reloaded.status).toBe("draft");
    expect(reloaded.publishedAt).toBeNull();
    expect(reloaded.isFeatured).toBe(false);
  });

  it("refuses to unpublish a project that isn't published", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const project = await insertProject(db, owner.id, { status: "draft" });
    signInAs(owner);

    await expect(revertProjectToDraft(project.id)).rejects.toThrow(
      "Only published projects can be unpublished",
    );
  });
});

describe("empty drafts", () => {
  it("reuses an untouched draft instead of creating another", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);

    const first = await createDraftProjectRecord();
    const second = await createDraftProjectRecord();

    expect(second.id).toBe(first.id);
    const rows = await db.select().from(schema.projects).where(eq(schema.projects.authorId, owner.id));
    expect(rows).toHaveLength(1);
  });

  it("deletes extra untouched drafts left over from before", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    await insertProject(db, owner.id);
    await insertProject(db, owner.id);
    signInAs(owner);

    await createDraftProjectRecord();

    const rows = await db.select().from(schema.projects).where(eq(schema.projects.authorId, owner.id));
    expect(rows).toHaveLength(1);
  });

  it("creates a new draft once the previous one has been saved", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);

    const first = await createDraftProjectRecord();
    await db
      .update(schema.projects)
      .set({ updatedAt: sql`now() + interval '1 second'` })
      .where(eq(schema.projects.id, first.id));
    const second = await createDraftProjectRecord();

    expect(second.id).not.toBe(first.id);
  });

  it("keeps a draft that has an uploaded image", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);

    const first = await createDraftProjectRecord();
    await db
      .insert(schema.mediaAssets)
      .values({ ownerType: "project", ownerId: first.id, filePath: "project/x/y.png" });
    const second = await createDraftProjectRecord();

    expect(second.id).not.toBe(first.id);
  });

  it("hides untouched drafts from getMyProjects", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    await insertProject(db, owner.id, { status: "draft" });
    const published = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
    });

    const mine = await getMyProjects(owner.id);

    expect(mine.map((p) => p.id)).toEqual([published.id]);
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
