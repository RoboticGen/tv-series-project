import { defineConfig } from "drizzle-kit";

// database/init/*.sql is the source of truth for the schema. This config
// exists for `drizzle-kit studio` (local DB browsing) only -- there is no
// `out` migrations folder wired into app startup, and `push`/`generate`
// against this file is not part of the schema-change workflow.
export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
