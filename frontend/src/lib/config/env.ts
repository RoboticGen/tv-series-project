import { z } from "zod";

const required = z.string().min(1);

const envSchema = z.object({
  DATABASE_URL: required,
  MONGODB_URI: required,
  AUTH_SECRET: required,
  CLIENT_ID: required,
  CLIENT_SECRET: required,
});

const OPTIONAL = [
  { vars: ["S3_BUCKET"], effect: "image uploads and cached PDF exports are unavailable" },
  { vars: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"], effect: "the weekly digest is not sent" },
  { vars: ["SITE_URL"], effect: "links in emails and metadata point at http://localhost:3000" },
];

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing required environment variables: ${missing}. See .env.example.`);
  }
  for (const { vars, effect } of OPTIONAL) {
    const missing = vars.filter((name) => !process.env[name]);
    if (missing.length > 0) console.warn(`[env] ${missing.join(", ")} not set: ${effect}.`);
  }
}
