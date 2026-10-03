import { timingSafeEqual } from "node:crypto";
import { sendWeeklyDigests } from "@/features/email-digest/services/digest";
import { isMailConfigured } from "@/services/mailer";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Called weekly by cron:
// Action : curl -X POST -H "Authorization: Bearer $CRON_SECRET" $SITE_URL/api/cron/digest
export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 });
  if (!isMailConfigured()) return Response.json({ error: "SMTP is not configured" }, { status: 503 });
  return Response.json(await sendWeeklyDigests());
}
