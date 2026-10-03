import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyUnsubscribeToken } from "@/features/email-digest/services/unsubscribe-token";
import { SITE_NAME } from "@/lib/config/site";

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#022f49">
<h1 style="font-size:22px">${title}</h1>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

const INVALID = () => page("This link isn't valid", "<p>Open your notification settings to change your emails.</p>", 400);

// GET only asks for confirmation, because mail scanners follow links.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!verifyUnsubscribeToken(token)) return INVALID();
  return page(
    "Unsubscribe from weekly emails?",
    `<form method="post"><button style="font-size:16px;font-weight:700;padding:10px 18px;border:2px solid #022f49;border-radius:8px;background:#fdb713;color:#022f49;cursor:pointer">Unsubscribe</button></form>`,
  );
}

// Also the target of Gmail's one-click unsubscribe (RFC 8058).
export async function POST(request: Request) {
  const userId = verifyUnsubscribeToken(new URL(request.url).searchParams.get("token"));
  if (!userId) return INVALID();
  await db.update(users).set({ emailDigest: false, emailMentorDigest: false }).where(eq(users.id, userId));
  return page("You're unsubscribed", `<p>You won't get weekly emails from ${SITE_NAME} any more.</p>`);
}
