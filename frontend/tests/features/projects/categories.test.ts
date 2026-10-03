import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS } from "@/features/projects/categories";
import { projectCategory } from "@/lib/db/schema";

describe("CATEGORY_LABELS", () => {
  it("has a human label for every enum value in the DB schema", () => {
    for (const value of projectCategory.enumValues) {
      expect(CATEGORY_LABELS[value]).toBeTypeOf("string");
      expect(CATEGORY_LABELS[value].length).toBeGreaterThan(0);
    }
  });

  it("has no extra keys beyond the enum (labels would silently never show)", () => {
    const extra = Object.keys(CATEGORY_LABELS).filter(
      (key) => !(projectCategory.enumValues as readonly string[]).includes(key),
    );
    expect(extra).toEqual([]);
  });

  it("is widened to Record<string, string> so an unknown/untrusted key is undefined, not a throw", () => {
    expect(CATEGORY_LABELS["not-a-real-category"]).toBeUndefined();
  });
});
