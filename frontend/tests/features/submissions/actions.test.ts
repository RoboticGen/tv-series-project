// createSubmission redirects on success (see src/features/submissions/actions.ts),
// which next/navigation's redirect() implements by throwing -- our mock
// (tests/setup/global-mocks.ts) reproduces that by throwing
// `NEXT_REDIRECT:<url>`, so a successful call is asserted by catching that
// specific throw rather than a normal return value.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { dbHolder, sessionHolder, type UserRole } from "../../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../../setup/pglite-db";
import { createSubmission } from "@/features/submissions/actions";
import { getSubmissionById } from "@/features/submissions/services/queries";

let handle: TestDbHandle;

function signInAs(user: { id: string; role?: UserRole }) {
  sessionHolder.session = { user: { id: user.id, role: user.role ?? "student" } };
}

async function expectRedirectTo(promise: Promise<unknown>, urlPrefix: string) {
  await expect(promise).rejects.toThrow(`NEXT_REDIRECT:${urlPrefix}`);
}

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  sessionHolder.session = null;
});

afterEach(async () => {
  await handle.close();
});

describe("createSubmission authorization", () => {
  it("throws when not signed in", async () => {
    await expect(
      createSubmission("00000000-0000-0000-0000-000000000000", { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] }),
    ).rejects.toThrow("Not signed in");
  });

  it("throws for a project that doesn't exist", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    signInAs(user);

    await expect(
      createSubmission("00000000-0000-0000-0000-000000000000", { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] }),
    ).rejects.toThrow("Project not found");
  });

  it("refuses a non-owner on a published but not-featured project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      isFeatured: false,
    });
    signInAs(stranger);

    await expect(createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] })).rejects.toThrow(
      "This project isn't featured yet",
    );
  });

  it("refuses a non-owner on a draft project even if isFeatured is (invalidly) true", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const stranger = await insertUser(db);
    const project = await insertProject(db, author.id, { status: "draft" });
    signInAs(stranger);

    await expect(createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] })).rejects.toThrow(
      "This project isn't featured yet",
    );
  });

  it("allows a non-owner on a published + featured project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
    });
    signInAs(builder);

    await expectRedirectTo(
      createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] }),
      "/dashboard/submissions/",
    );
  });

  it("always allows the project's own author, regardless of publish/featured status", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, { status: "draft" });
    signInAs(author);

    await expectRedirectTo(
      createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] }),
      "/dashboard/submissions/",
    );
  });
});

describe("createSubmission privacy rule", () => {
  it("forces isPrivate=true for a non-owner even if they pass isPrivate: false", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
    });
    signInAs(builder);

    await expect(
      createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }], isPrivate: false }),
    ).rejects.toThrow(); // redirect() throws on success

    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.userId, builder.id));
    expect(submission.isPrivate).toBe(true);
  });

  it("lets the project's own author choose to publish their submission", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, { status: "draft" });
    signInAs(author);

    await expect(
      createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }], isPrivate: false }),
    ).rejects.toThrow();

    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.userId, author.id));
    expect(submission.isPrivate).toBe(false);
  });

  it("defaults the author's own submission to private when isPrivate is omitted", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, { status: "draft" });
    signInAs(author);

    await expect(createSubmission(project.id, { steps: [{ id: "s1", title: "", images: [], body: "a".repeat(20) }] })).rejects.toThrow();

    const [submission] = await db
      .select()
      .from(schema.submissions)
      .where(eq(schema.submissions.userId, author.id));
    expect(submission.isPrivate).toBe(true);
  });
});

describe("getSubmissionById", () => {
  it("returns null for a submission belonging to a different viewer", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const owner = await insertUser(db);
    const snoop = await insertUser(db);
    const project = await insertProject(db, author.id);
    const [submission] = await db
      .insert(schema.submissions)
      .values({ projectId: project.id, userId: owner.id, contentDocId: "doc-1" })
      .returning();

    expect(await getSubmissionById(submission.id, snoop.id)).toBeNull();
    expect(await getSubmissionById(submission.id, owner.id)).not.toBeNull();
  });
});

describe("createSubmission points toast", () => {
  const steps = [{ id: "s1", title: "", images: [], body: "a".repeat(20) }];

  it("adds ?earned to the redirect only the first time a build earns points", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const builder = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
    });

    signInAs(builder);
    await expect(createSubmission(project.id, { steps })).rejects.toThrow(/\?earned=5$/);
    await expect(createSubmission(project.id, { steps })).rejects.toThrow(/\/dashboard\/submissions\/[0-9a-f-]+$/);

    signInAs(author);
    await expect(createSubmission(project.id, { steps })).rejects.toThrow(/\/dashboard\/submissions\/[0-9a-f-]+$/);
  });
});
