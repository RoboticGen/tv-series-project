import { describe, expect, it } from "vitest";
import { randomSlugSuffix, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Robot Arm")).toBe("my-robot-arm");
  });

  it("strips punctuation and collapses runs of non-alphanumerics", () => {
    expect(slugify("Line-Following Robot!! v2.0")).toBe("line-following-robot-v2-0");
  });

  it("trims leading/trailing hyphens produced by leading/trailing junk", () => {
    expect(slugify("  ---Hello World---  ")).toBe("hello-world");
  });

  it("falls back to 'project' when nothing alphanumeric survives", () => {
    expect(slugify("!!!")).toBe("project");
    expect(slugify("")).toBe("project");
    expect(slugify("   ")).toBe("project");
  });

  it("handles unicode input by dropping non a-z0-9 characters", () => {
    // Non-ASCII letters aren't in [a-z0-9], so they collapse to separators.
    expect(slugify("Café Röbot")).toBe("caf-r-bot");
  });

  it("preserves digits", () => {
    expect(slugify("3D Printer Mk2")).toBe("3d-printer-mk2");
  });
});

describe("randomSlugSuffix", () => {
  it("returns a short lowercase alphanumeric string", () => {
    const suffix = randomSlugSuffix();
    expect(suffix).toMatch(/^[a-z0-9]{1,6}$/);
  });

  it("is not deterministic across calls (extremely unlikely to collide)", () => {
    const suffixes = new Set(Array.from({ length: 20 }, () => randomSlugSuffix()));
    expect(suffixes.size).toBeGreaterThan(1);
  });
});
