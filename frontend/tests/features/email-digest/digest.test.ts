import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { dbHolder, sessionHolder } from "../../setup/global-mocks";
import { createTestDb, insertProject, insertUser, type TestDbHandle } from "../../setup/pglite-db";

vi.mock("@/services/mailer", () => ({
  isMailConfigured: vi.fn(() => true),
  sendMail: vi.fn(async () => undefined),
}));

process.env.AUTH_SECRET = "test-secret";

const { sendMail } = await import("@/services/mailer");
const { sendWeeklyDigests } = await import("@/features/email-digest/services/digest");
const { unsubscribeToken, verifyUnsubscribeToken } = await import("@/features/email-digest/services/unsubscribe-token");
const unsubscribe = await import("@/app/api/unsubscribe/route");
const cron = await import("@/app/api/cron/digest/route");
const { setEmailPreference } = await import("@/features/email-digest/actions");
const { getEmailPreferences } = await import("@/features/email-digest/services/queries");

let handle: TestDbHandle;
let mentor: typeof schema.users.$inferSelect;

beforeEach(async () => {
  handle = await createTestDb();
  dbHolder.db = handle.db;
  vi.mocked(sendMail).mockClear();
  mentor = await insertUser(handle.db, { role: "mentor", emailMentorDigest: false });
});

afterEach(async () => {
  await handle.close();
});

function publish(authorId: string, title: string) {
  return insertProject(handle.db, authorId, {
    title,
    status: "published",
    publishedAt: new Date(),
    reviewedById: mentor.id,
    reviewedAt: new Date(),
  });
}

async function getUser(id: string) {
  const [row] = await handle.db.select().from(schema.users).where(eq(schema.users.id, id));
  return row;
}

describe("weekly digest", () => {
  it("emails an opted-in student their week, once", async () => {
    const author = await insertUser(handle.db, { displayName: "Ada", emailDigest: true });
    const fan = await insertUser(handle.db);
    const project = await publish(author.id, "Line <Robot>");
    await handle.db.insert(schema.projectStars).values({ userId: fan.id, projectId: project.id });
    await handle.db.insert(schema.follows).values({ followerId: fan.id, followeeId: author.id });

    expect(await sendWeeklyDigests()).toEqual({ sent: 1, empty: 0, failed: 0 });

    const [mail] = vi.mocked(sendMail).mock.calls[0];
    expect(mail.to).toBe(author.email);
    expect(mail.text).toContain("Line <Robot>: 1 star");
    expect(mail.text).toContain("1 new follower");
    expect(mail.text).toContain("+3 builder points");
    expect(mail.html).toContain("Line &#60;Robot&#62;");
    expect(verifyUnsubscribeToken(new URL(mail.unsubscribeUrl).searchParams.get("token"))).toBe(author.id);
    expect((await getUser(author.id)).lastDigestSentAt).not.toBeNull();

    expect(await sendWeeklyDigests()).toEqual({ sent: 0, empty: 0, failed: 0 });
  });

  it("skips students who haven't opted in, have no activity, or are disabled", async () => {
    const quiet = await insertUser(handle.db, { emailDigest: true });
    const notOptedIn = await insertUser(handle.db);
    const disabled = await insertUser(handle.db, { emailDigest: true, isDisabled: true });
    const fan = await insertUser(handle.db);
    for (const author of [notOptedIn, disabled]) {
      const project = await publish(author.id, "Project");
      await handle.db.insert(schema.projectStars).values({ userId: fan.id, projectId: project.id });
    }

    expect(await sendWeeklyDigests()).toEqual({ sent: 0, empty: 1, failed: 0 });
    expect((await getUser(quiet.id)).lastDigestSentAt).toBeNull();
  });

  it("sends mentors the projects published this week unless they opted out", async () => {
    const reviewer = await insertUser(handle.db, { role: "mentor" });
    const author = await insertUser(handle.db, { displayName: "Kasun" });
    await publish(author.id, "Fresh Robot");
    const old = await publish(author.id, "Old Robot");
    await handle.db
      .update(schema.projects)
      .set({ publishedAt: new Date(Date.now() - 30 * 86_400_000) })
      .where(eq(schema.projects.id, old.id));

    expect(await sendWeeklyDigests()).toEqual({ sent: 1, empty: 0, failed: 0 });

    const [mail] = vi.mocked(sendMail).mock.calls[0];
    expect(mail.to).toBe(reviewer.email);
    expect(mail.text).toContain("Fresh Robot by Kasun");
    expect(mail.text).not.toContain("Old Robot");
  });

  it("counts a failed send and retries it next run", async () => {
    const reviewer = await insertUser(handle.db, { role: "admin" });
    await publish(reviewer.id, "Robot");
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("SMTP down"));
    vi.spyOn(console, "error").mockImplementationOnce(() => {});

    expect(await sendWeeklyDigests()).toEqual({ sent: 0, empty: 0, failed: 1 });
    expect(await sendWeeklyDigests()).toEqual({ sent: 1, empty: 0, failed: 0 });
  });
});

describe("unsubscribe link", () => {
  const url = (token: string) => `http://localhost/api/unsubscribe?token=${encodeURIComponent(token)}`;

  it("only unsubscribes on POST, and turns both emails off", async () => {
    const user = await insertUser(handle.db, { emailDigest: true });
    const token = unsubscribeToken(user.id);

    expect((await unsubscribe.GET(new Request(url(token)))).status).toBe(200);
    expect((await getUser(user.id)).emailDigest).toBe(true);

    expect((await unsubscribe.POST(new Request(url(token), { method: "POST" }))).status).toBe(200);
    expect(await getUser(user.id)).toMatchObject({ emailDigest: false, emailMentorDigest: false });
  });

  it("rejects a forged token", async () => {
    const user = await insertUser(handle.db, { emailDigest: true });
    const other = await insertUser(handle.db);
    const forged = `${user.id}.${unsubscribeToken(other.id).split(".")[1]}`;

    expect((await unsubscribe.POST(new Request(url(forged), { method: "POST" }))).status).toBe(400);
    expect((await unsubscribe.POST(new Request(url("garbage"), { method: "POST" }))).status).toBe(400);
    expect((await getUser(user.id)).emailDigest).toBe(true);
  });
});

describe("cron route", () => {
  const call = (auth?: string) =>
    cron.POST(new Request("http://localhost/api/cron/digest", { method: "POST", headers: auth ? { authorization: auth } : {} }));

  it("requires the cron secret", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer anything")).status).toBe(401);

    process.env.CRON_SECRET = "s3cret";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong!")).status).toBe(401);

    const ok = await call("Bearer s3cret");
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ sent: 0, empty: 0, failed: 0 });
  });
});

describe("email preferences", () => {
  it("reads and changes only the signed-in user's settings", async () => {
    const user = await insertUser(handle.db);
    const other = await insertUser(handle.db);
    sessionHolder.session = { user: { id: user.id, role: "student" } };

    expect(await getEmailPreferences()).toEqual({ emailDigest: false, emailMentorDigest: true, isStaff: false });
    await setEmailPreference("digest", true);

    expect((await getUser(user.id)).emailDigest).toBe(true);
    expect((await getUser(other.id)).emailDigest).toBe(false);

    sessionHolder.session = null;
    await expect(setEmailPreference("digest", true)).rejects.toThrow("Not signed in");
  });
});
