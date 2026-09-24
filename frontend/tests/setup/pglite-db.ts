// Boots a real (in-process, in-memory) Postgres via PGlite and loads the
// actual schema from database/init/*.sql -- the same files the real
// deployment bootstraps from -- so tests exercise the real ENUMs, CHECK
// constraints, triggers (points, denormalized counts, cascades) and
// unique indexes, not a hand-rolled approximation of them.
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";

const INIT_DIR = path.resolve(__dirname, "../../../database/init");
const INIT_FILES = [
  "001_extensions.sql",
  "002_types.sql",
  "003_functions.sql",
  "004_tables.sql",
  "005_views.sql",
];

export type TestDb = PgliteDatabase<typeof schema>;

export interface TestDbHandle {
  client: PGlite;
  db: TestDb;
  close: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDbHandle> {
  const client = new PGlite({
    extensions: { pgcrypto, citext, pg_trgm },
  });

  for (const file of INIT_FILES) {
    const sqlText = fs.readFileSync(path.join(INIT_DIR, file), "utf8");
    await client.exec(sqlText);
  }

  const db = drizzle(client, { schema });
  return { client, db, close: () => client.close() };
}

// Convenience factory for a user row -- every table under test hangs off
// users.id via FKs, so almost every test needs at least one.
export async function insertUser(
  db: TestDb,
  overrides: Partial<typeof schema.users.$inferInsert> = {},
) {
  const [user] = await db
    .insert(schema.users)
    .values({
      googleId: overrides.googleId ?? `google-${crypto.randomUUID()}`,
      email: overrides.email ?? `${crypto.randomUUID()}@example.com`,
      displayName: overrides.displayName ?? "Test User",
      role: overrides.role ?? "student",
      ...overrides,
    })
    .returning();
  return user;
}

export async function insertProject(
  db: TestDb,
  authorId: string,
  overrides: Partial<typeof schema.projects.$inferInsert> = {},
) {
  const [project] = await db
    .insert(schema.projects)
    .values({
      authorId,
      category: "robotics",
      title: overrides.title ?? "Test Project",
      slug: overrides.slug ?? `test-project-${crypto.randomUUID()}`,
      summary: overrides.summary ?? "A test project summary.",
      contentDocId: overrides.contentDocId ?? "mock-content-doc-id",
      status: overrides.status ?? "draft",
      ...overrides,
    })
    .returning();
  return project;
}
