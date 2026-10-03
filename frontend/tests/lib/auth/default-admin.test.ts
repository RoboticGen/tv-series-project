import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isDefaultAdmin } from "@/lib/auth/default-admin";

const ORIGINAL_ADMIN_EMAIL = process.env.ADMIN_EMAIL;

describe("isDefaultAdmin", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "Admin@Example.com";
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL = ORIGINAL_ADMIN_EMAIL;
  });

  it("matches case-insensitively", () => {
    expect(isDefaultAdmin("admin@example.com")).toBe(true);
    expect(isDefaultAdmin("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  it("matches after trimming surrounding whitespace on both sides", () => {
    expect(isDefaultAdmin("  admin@example.com  ")).toBe(true);
  });

  it("rejects a different email", () => {
    expect(isDefaultAdmin("someone-else@example.com")).toBe(false);
  });

  it("rejects null/undefined without throwing", () => {
    expect(isDefaultAdmin(null)).toBe(false);
    expect(isDefaultAdmin(undefined)).toBe(false);
  });

  // Security-relevant: an unset ADMIN_EMAIL must never make every/no email
  // "the" default admin by some falsy-comparison accident.
  it("returns false for every input when ADMIN_EMAIL is unset", () => {
    delete process.env.ADMIN_EMAIL;
    expect(isDefaultAdmin("admin@example.com")).toBe(false);
    expect(isDefaultAdmin("")).toBe(false);
    expect(isDefaultAdmin(null)).toBe(false);
  });

  it("returns false for every input when ADMIN_EMAIL is blank/whitespace", () => {
    process.env.ADMIN_EMAIL = "   ";
    expect(isDefaultAdmin("")).toBe(false);
    expect(isDefaultAdmin("   ")).toBe(false);
  });
});
