import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbHolder, sessionHolder } from "../../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../../setup/pglite-db";
import { createCollection, deleteCollection, toggleProjectInCollection, updateCollection } from "@/features/collections/actions";
import { getCollectionBySlug } from "@/features/collections/services/queries";

let handle: TestDbHandle;

function signInAs(user: { id: string }) {
  sessionHolder.session = { user: { id: user.id, role: "student" } };
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
});

afterEach(async () => {
  await handle.close();
});

describe("createCollection", () => {
  it("throws when not signed in", async () => {
    await expect(createCollection({ title: "My Builds" })).rejects.toThrow("Not signed in");
  });

  it("de-duplicates the slug when the title collides", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);

    const first = await createCollection({ title: "Robot Arms" });
    const second = await createCollection({ title: "Robot Arms" });

    expect(first.slug).toBe("robot-arms");
    expect(second.slug).not.toBe(first.slug);
    expect(second.slug.startsWith("robot-arms-")).toBe(true);
  });
});

describe("ownership enforcement", () => {
  async function setupCollection() {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);
    const collection = await createCollection({ title: "Owner's Collection" });
    return { owner, collection };
  }

  it("refuses updateCollection for a non-owner", async () => {
    const { db } = handle;
    const { collection } = await setupCollection();
    const stranger = await insertUser(db);
    signInAs(stranger);

    await expect(
      updateCollection(collection.id, { title: "Hijacked" }),
    ).rejects.toThrow("Not authorized to manage this collection");
  });

  it("refuses deleteCollection for a non-owner", async () => {
    const { db } = handle;
    const { collection } = await setupCollection();
    const stranger = await insertUser(db);
    signInAs(stranger);

    await expect(deleteCollection(collection.id)).rejects.toThrow(
      "Not authorized to manage this collection",
    );
  });

  it("refuses toggleProjectInCollection for a non-owner", async () => {
    const { db } = handle;
    const { collection } = await setupCollection();
    const stranger = await insertUser(db);
    const project = await insertProject(db, stranger.id);
    signInAs(stranger);

    await expect(
      toggleProjectInCollection(collection.id, project.id),
    ).rejects.toThrow("Not authorized to manage this collection");
  });

  it("lets the owner add and remove a project from their own collection", async () => {
    const { db } = handle;
    const { owner, collection } = await setupCollection();
    const project = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(owner);

    const added = await toggleProjectInCollection(collection.id, project.id);
    expect(added).toEqual({ added: true });
    const removed = await toggleProjectInCollection(collection.id, project.id);
    expect(removed).toEqual({ added: false });
  });
});

describe("getCollectionBySlug visibility", () => {
  it("hides a private collection from anyone but its owner", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    const viewer = await insertUser(db);
    signInAs(owner);
    const collection = await createCollection({ title: "Secret Stash", isPrivate: true });

    expect(await getCollectionBySlug(collection.slug, viewer.id)).toBeNull();
    expect(await getCollectionBySlug(collection.slug)).toBeNull();
    expect(await getCollectionBySlug(collection.slug, owner.id)).not.toBeNull();
  });

  it("only lists published projects inside a public collection", async () => {
    const { db } = handle;
    const owner = await insertUser(db);
    signInAs(owner);
    const collection = await createCollection({ title: "Public Picks" });
    const published = await insertProject(db, owner.id, {
      status: "published",
      publishedAt: new Date(),
      slug: "published-one",
    });
    const draft = await insertProject(db, owner.id, { status: "draft", slug: "draft-one" });

    await toggleProjectInCollection(collection.id, published.id);
    await toggleProjectInCollection(collection.id, draft.id);

    const result = await getCollectionBySlug(collection.slug);
    expect(result?.projects.map((p) => p.slug)).toEqual(["published-one"]);
  });
});
