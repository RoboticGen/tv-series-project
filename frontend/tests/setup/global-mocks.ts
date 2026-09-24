// Runs before every test file (see vitest.config.ts `setupFiles`). Fresh
// per test file, since each file gets its own isolated module registry --
// that's what lets `dbHolder`/`sessionHolder` be set independently per file
// without leaking state between them.
//
// We mock the seams that require a real Next.js request context or a real
// network connection (auth, revalidation, redirects, Mongo, disk) so that
// server actions can be exercised directly and cheaply. `@/db` is the one
// exception worth calling out: instead of a stub, tests point `dbHolder.db`
// at a real Drizzle instance backed by PGlite (see tests/setup/pglite-db.ts)
// running the actual schema/triggers from database/init/*.sql -- so
// business rules enforced at the DB layer (points, uniqueness, cascades)
// are exercised for real, not assumed.
import { vi } from "vitest";
import type { TestDb } from "./pglite-db";

export type UserRole = "student" | "mentor" | "admin";

// A minimal stand-in for next-auth's Session -- only the shape every
// action actually reads (session.user.id / .role), not the full
// next-auth type (which also requires `expires` etc. that no action here
// looks at).
export interface FakeSession {
  user: { id: string; role: UserRole };
}

export const dbHolder: { db: TestDb | undefined } = { db: undefined };
export const sessionHolder: { session: FakeSession | null } = { session: null };

vi.mock("@/db", () => ({
  get db() {
    return dbHolder.db;
  },
}));

vi.mock("@/auth", () => ({
  auth: () => Promise.resolve(sessionHolder.session),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// Content bodies live in Mongo in production; tests never need a real
// Mongo connection to exercise Postgres-side business logic.
vi.mock("@/db/content", () => ({
  createContentDoc: vi.fn(async () => "mock-content-doc-id"),
  getContentDoc: vi.fn(async () => null),
  updateContentDoc: vi.fn(async () => undefined),
  deleteContentDoc: vi.fn(async () => undefined),
}));

// Uploaded files live on disk in production; stub the filesystem side so
// action tests don't touch the real disk.
vi.mock("@/lib/storage", () => ({
  saveUploadedFile: vi.fn(async () => "project/mock-owner/mock-file.png"),
  deleteUploadedFile: vi.fn(async () => undefined),
  resolveMediaPath: vi.fn((p: string) => `/tmp/mock-storage/${p}`),
}));
