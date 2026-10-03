import "server-only";
import { and, count, desc, eq, gt, inArray, isNull, lt, or, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, projects, users } from "@/lib/db/schema";
import { sendMail } from "@/services/mailer";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import { unsubscribeToken } from "@/features/email-digest/services/unsubscribe-token";

const DAY_MS = 86_400_000;

type NotificationType = (typeof notifications.type.enumValues)[number];

interface ActivityRow {
  type: NotificationType;
  projectTitle: string | null;
  projectSlug: string | null;
  total: number;
  points: number;
}

interface PublishedRow {
  title: string;
  slug: string;
  authorName: string;
}

const PROJECT_LABELS: Partial<Record<NotificationType, [one: string, many: string]>> = {
  project_starred: ["star", "stars"],
  project_built: ["build", "builds"],
  project_commented: ["comment", "comments"],
  comment_replied: ["reply to your comment", "replies to your comments"],
  project_featured: ["feature by mentors", "features by mentors"],
  project_unpublished: ["takedown by a mentor", "takedowns by a mentor"],
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function plural(n: number, [one, many]: [string, string]) {
  return `${n} ${n === 1 ? one : many}`;
}

export function buildDigestEmail(input: {
  name: string;
  activity: ActivityRow[];
  published: PublishedRow[];
  unsubscribeUrl: string;
}) {
  const { name, activity, published, unsubscribeUrl } = input;
  if (activity.length === 0 && published.length === 0) return null;

  const html: string[] = [];
  const text: string[] = [`Hi ${name},`, ""];

  if (activity.length > 0) {
    const byProject = new Map<string, { title: string; slug: string | null; parts: string[] }>();
    let followers = 0;
    let points = 0;
    for (const row of activity) {
      points += row.points;
      if (row.type === "new_follower") {
        followers += row.total;
        continue;
      }
      const label = PROJECT_LABELS[row.type];
      if (!label) continue;
      const key = row.projectSlug ?? "";
      const entry = byProject.get(key) ?? { title: row.projectTitle ?? "A project", slug: row.projectSlug, parts: [] };
      entry.parts.push(plural(row.total, label));
      byProject.set(key, entry);
    }

    html.push(`<h2 style="font-size:16px;margin:24px 0 8px">Your week</h2><ul style="padding-left:20px;margin:0">`);
    text.push("YOUR WEEK");
    for (const { title, slug, parts } of byProject.values()) {
      const safeTitle = escapeHtml(title);
      const link = slug
        ? `<a href="${SITE_URL}/projects/${slug}" style="color:#219cbc;font-weight:700">${safeTitle}</a>`
        : `<b>${safeTitle}</b>`;
      html.push(`<li style="margin:6px 0">${link}: ${parts.join(", ")}</li>`);
      text.push(`- ${title}: ${parts.join(", ")}`);
    }
    if (followers > 0) {
      const line = plural(followers, ["new follower", "new followers"]);
      html.push(`<li style="margin:6px 0">${line}</li>`);
      text.push(`- ${line}`);
    }
    html.push("</ul>");
    if (points > 0) {
      html.push(`<p style="margin:12px 0 0"><b>+${points} builder points</b> this week.</p>`);
      text.push(`+${points} builder points this week.`);
    }
    text.push("");
  }

  if (published.length > 0) {
    html.push(
      `<h2 style="font-size:16px;margin:24px 0 8px">Published this week</h2><ul style="padding-left:20px;margin:0">`,
    );
    text.push("PUBLISHED THIS WEEK");
    for (const project of published) {
      html.push(
        `<li style="margin:6px 0"><a href="${SITE_URL}/projects/${project.slug}" style="color:#219cbc;font-weight:700">${escapeHtml(project.title)}</a> by ${escapeHtml(project.authorName)}</li>`,
      );
      text.push(`- ${project.title} by ${project.authorName}: ${SITE_URL}/projects/${project.slug}`);
    }
    html.push(`</ul><p style="margin:12px 0 0"><a href="${SITE_URL}/dashboard/review" style="color:#219cbc">Open the review queue</a></p>`);
    text.push(`Review queue: ${SITE_URL}/dashboard/review`, "");
  }

  text.push(`Unsubscribe: ${unsubscribeUrl}`);

  return {
    subject: `Your week on ${SITE_NAME}`,
    text: text.join("\n"),
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#022f49;font-size:14px;line-height:1.5">
<p style="font-size:18px;font-weight:900;margin:0 0 16px">${SITE_NAME}</p>
<p style="margin:0">Hi ${escapeHtml(name)},</p>
${html.join("\n")}
<p style="margin:32px 0 0;padding-top:16px;border-top:2px solid #022f49;font-size:12px;color:#939598">
You get this weekly summary from ${SITE_NAME}.
<a href="${unsubscribeUrl}" style="color:#939598">Unsubscribe</a> or change it in
<a href="${SITE_URL}/dashboard/notifications" style="color:#939598">your notification settings</a>.</p>
</div>`,
  };
}

const recipientColumns = {
  id: users.id,
  email: users.email,
  name: users.displayName,
  role: users.role,
  emailDigest: users.emailDigest,
  emailMentorDigest: users.emailMentorDigest,
  lastDigestSentAt: users.lastDigestSentAt,
};


function isDue(now: Date) {
  return and(
    eq(users.isDisabled, false),
    or(
      eq(users.emailDigest, true),
      and(inArray(users.role, ["mentor", "admin"]), eq(users.emailMentorDigest, true)),
    ),
    or(isNull(users.lastDigestSentAt), lt(users.lastDigestSentAt, new Date(now.getTime() - 6 * DAY_MS))),
  );
}

export async function listDigestRecipientIds(now = new Date()) {
  const rows = await db.select({ id: users.id }).from(users).where(isDue(now));
  return rows.map((row) => row.id);
}

export async function sendDigestToUser(userId: string, now = new Date()): Promise<"sent" | "empty" | "skipped"> {
  const [user] = await db
    .select(recipientColumns)
    .from(users)
    .where(and(eq(users.id, userId), isDue(now)));
  if (!user) return "skipped";

  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const since = user.lastDigestSentAt && user.lastDigestSentAt > weekAgo ? user.lastDigestSentAt : weekAgo;
  const isStaff = user.role === "mentor" || user.role === "admin";

  const [activity, published] = await Promise.all([
    user.emailDigest
      ? db
          .select({
            type: notifications.type,
            projectTitle: projects.title,
            projectSlug: projects.slug,
            total: count(),
            points: sum(notifications.points).mapWith(Number),
          })
          .from(notifications)
          .leftJoin(projects, eq(notifications.projectId, projects.id))
          .where(and(eq(notifications.recipientId, user.id), gt(notifications.createdAt, since)))
          .groupBy(notifications.type, projects.id)
      : [],
    isStaff && user.emailMentorDigest
      ? db
          .select({ title: projects.title, slug: projects.slug, authorName: users.displayName })
          .from(projects)
          .innerJoin(users, eq(projects.authorId, users.id))
          .where(and(eq(projects.status, "published"), gt(projects.publishedAt, since)))
          .orderBy(desc(projects.publishedAt))
          .limit(50)
      : [],
  ]);

  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken(user.id)}`;
  const email = buildDigestEmail({
    name: user.name,
    activity: activity.map((row) => ({ ...row, points: row.points ?? 0 })),
    published,
    unsubscribeUrl,
  });
  if (!email) return "empty";

  await sendMail({ to: user.email, unsubscribeUrl, ...email });
  await db.update(users).set({ lastDigestSentAt: now }).where(eq(users.id, user.id));
  return "sent";
}

export async function sendWeeklyDigests(now = new Date()) {
  const result = { sent: 0, empty: 0, failed: 0 };

  for (const userId of await listDigestRecipientIds(now)) {
    try {
      const outcome = await sendDigestToUser(userId, now);
      if (outcome !== "skipped") result[outcome] += 1;
    } catch (err) {
      console.error(`Digest email failed for user ${userId}`, err);
      result.failed += 1;
    }
  }

  return result;
}
