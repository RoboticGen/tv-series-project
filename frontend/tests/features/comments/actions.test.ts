// Server action tests: the real action code from src/features/comments/actions.ts
// runs against a real PGlite-backed db (see tests/setup/pglite-db.ts) with
// only auth()/revalidatePath mocked (see tests/setup/global-mocks.ts) --
// so both the authorization logic and its interaction with real DB state
// are exercised together, not just one or the other.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbHolder, sessionHolder, type UserRole } from "../../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../../setup/pglite-db";
import { addComment, deleteComment, listComments } from "@/features/comments/actions";

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

describe("addComment", () => {
  it("throws when not signed in", async () => {
    await expect(addComment("00000000-0000-0000-0000-000000000000", "hi")).rejects.toThrow(
      "Not signed in",
    );
  });

  it("throws for a project that doesn't exist", async () => {
    const { db } = handle;
    const user = await insertUser(db);
    signInAs(user);

    await expect(addComment("00000000-0000-0000-0000-000000000000", "hi")).rejects.toThrow(
      "Project not found",
    );
  });

  it("refuses to comment on a project that isn't published", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, { status: "draft" });
    signInAs(author);

    await expect(addComment(project.id, "hi")).rejects.toThrow(
      "Comments are only allowed on published projects",
    );
  });

  it("adds a top-level comment on a published project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(author);

    await addComment(project.id, "Great build!");

    const comments = await listComments(project.id);
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe("Great build!");
    expect(comments[0].replies).toEqual([]);
  });

  it("adds a reply to a top-level comment", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const replier = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(author);
    await addComment(project.id, "Top level");
    const [top] = await listComments(project.id);

    signInAs(replier);
    await addComment(project.id, "A reply", top.id);

    const comments = await listComments(project.id);
    expect(comments).toHaveLength(1);
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies[0].body).toBe("A reply");
  });

  // Business rule enforced in the action, not the schema (see the
  // comment above addComment in src/features/comments/actions.ts) -- keeps
  // threading to exactly one level so the UI never has to render
  // unbounded nesting.
  it("refuses to reply to a reply", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(author);
    await addComment(project.id, "Top level");
    const [top] = await listComments(project.id);
    await addComment(project.id, "A reply", top.id);
    const [refreshedTop] = await listComments(project.id);
    const reply = refreshedTop.replies[0];

    await expect(addComment(project.id, "Reply to a reply", reply.id)).rejects.toThrow(
      "Can't reply to a reply",
    );
  });

  it("refuses a parentCommentId belonging to a different project", async () => {
    const { db } = handle;
    const author = await insertUser(db);
    const projectA = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      slug: "project-a",
    });
    const projectB = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
      slug: "project-b",
    });
    signInAs(author);
    await addComment(projectA.id, "On A");
    const [commentOnA] = await listComments(projectA.id);

    await expect(addComment(projectB.id, "Cross-project reply", commentOnA.id)).rejects.toThrow(
      "Comment not found",
    );
  });
});

describe("deleteComment", () => {
  async function setupComment() {
    const { db } = handle;
    const author = await insertUser(db);
    const commenter = await insertUser(db);
    const project = await insertProject(db, author.id, {
      status: "published",
      publishedAt: new Date(),
    });
    signInAs(commenter);
    await addComment(project.id, "Original comment");
    const [comment] = await listComments(project.id);
    return { author, commenter, project, comment };
  }

  it("throws when not signed in", async () => {
    const { comment } = await setupComment();
    sessionHolder.session = null;
    await expect(deleteComment(comment.id)).rejects.toThrow("Not signed in");
  });

  it("lets the comment's own author delete it", async () => {
    const { commenter, project, comment } = await setupComment();
    signInAs(commenter);

    await deleteComment(comment.id);

    expect(await listComments(project.id)).toHaveLength(0);
  });

  it("lets a mentor delete someone else's comment", async () => {
    const { db } = handle;
    const { project, comment } = await setupComment();
    const mentor = await insertUser(db, { role: "mentor" });
    signInAs(mentor);

    await deleteComment(comment.id);

    expect(await listComments(project.id)).toHaveLength(0);
  });

  it("lets an admin delete someone else's comment", async () => {
    const { db } = handle;
    const { project, comment } = await setupComment();
    const admin = await insertUser(db, { role: "admin" });
    signInAs(admin);

    await deleteComment(comment.id);

    expect(await listComments(project.id)).toHaveLength(0);
  });

  it("refuses to let an unrelated student delete someone else's comment", async () => {
    const { db } = handle;
    const { project, comment } = await setupComment();
    const otherStudent = await insertUser(db, { role: "student" });
    signInAs(otherStudent);

    await expect(deleteComment(comment.id)).rejects.toThrow(
      "Not authorized to delete this comment",
    );
    expect(await listComments(project.id)).toHaveLength(1);
  });
});
