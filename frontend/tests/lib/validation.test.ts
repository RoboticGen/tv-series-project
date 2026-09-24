import { describe, expect, it } from "vitest";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  createCollectionSchema,
  createCommentSchema,
  createProjectSchema,
  createSubmissionSchema,
} from "@/lib/validation";

describe("createProjectSchema", () => {
  const valid = {
    title: "My Robot Project",
    summary: "A summary that is definitely long enough.",
    category: "robotics",
    body: "A write-up body that is long enough to pass validation.",
  };

  it("accepts a valid payload", () => {
    expect(createProjectSchema.parse(valid)).toMatchObject(valid);
  });

  it("trims title/summary/body", () => {
    const parsed = createProjectSchema.parse({
      ...valid,
      title: "  Padded Title  ",
    });
    expect(parsed.title).toBe("Padded Title");
  });

  it("rejects a title shorter than 3 characters", () => {
    expect(() => createProjectSchema.parse({ ...valid, title: "ab" })).toThrow();
  });

  it("rejects a title longer than 120 characters", () => {
    expect(() => createProjectSchema.parse({ ...valid, title: "a".repeat(121) })).toThrow();
  });

  it("accepts the title boundary lengths (3 and 120)", () => {
    expect(() => createProjectSchema.parse({ ...valid, title: "abc" })).not.toThrow();
    expect(() => createProjectSchema.parse({ ...valid, title: "a".repeat(120) })).not.toThrow();
  });

  it("rejects a summary shorter than 10 characters", () => {
    expect(() => createProjectSchema.parse({ ...valid, summary: "too short" })).toThrow();
  });

  it("rejects a summary longer than 500 characters", () => {
    expect(() => createProjectSchema.parse({ ...valid, summary: "a".repeat(501) })).toThrow();
  });

  it("rejects a body shorter than 20 characters", () => {
    expect(() => createProjectSchema.parse({ ...valid, body: "short body" })).toThrow();
  });

  it("rejects a category outside the fixed enum", () => {
    expect(() => createProjectSchema.parse({ ...valid, category: "not-a-category" })).toThrow();
  });

  it("rejects a missing field", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.title;
    expect(() => createProjectSchema.parse(rest)).toThrow();
  });
});

describe("createSubmissionSchema", () => {
  it("accepts a body >= 20 chars with isPrivate omitted", () => {
    const parsed = createSubmissionSchema.parse({ body: "a".repeat(20) });
    expect(parsed.body).toHaveLength(20);
    expect(parsed.isPrivate).toBeUndefined();
  });

  it("rejects a body under 20 chars", () => {
    expect(() => createSubmissionSchema.parse({ body: "too short" })).toThrow();
  });

  it("accepts an explicit isPrivate boolean", () => {
    expect(createSubmissionSchema.parse({ body: "a".repeat(20), isPrivate: false }).isPrivate).toBe(
      false,
    );
  });
});

describe("createCommentSchema", () => {
  it("accepts a single non-empty character", () => {
    expect(createCommentSchema.parse({ body: "!" }).body).toBe("!");
  });

  it("rejects an empty body", () => {
    expect(() => createCommentSchema.parse({ body: "" })).toThrow();
  });

  it("rejects a body over 2000 characters", () => {
    expect(() => createCommentSchema.parse({ body: "a".repeat(2001) })).toThrow();
  });

  it("accepts exactly 2000 characters", () => {
    expect(() => createCommentSchema.parse({ body: "a".repeat(2000) })).not.toThrow();
  });
});

describe("createCollectionSchema", () => {
  it("accepts a title-only payload", () => {
    const parsed = createCollectionSchema.parse({ title: "My Builds" });
    expect(parsed.title).toBe("My Builds");
    expect(parsed.isPrivate).toBeUndefined();
  });

  it("rejects a title shorter than 3 characters", () => {
    expect(() => createCollectionSchema.parse({ title: "ab" })).toThrow();
  });

  it("rejects a description over 500 characters", () => {
    expect(() =>
      createCollectionSchema.parse({ title: "My Builds", description: "a".repeat(501) }),
    ).toThrow();
  });
});

describe("upload constants", () => {
  it("only allows the four documented raster image types", () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).toEqual(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  });

  it("excludes SVG (XSS risk if served inline) from allowed types", () => {
    expect(ALLOWED_IMAGE_MIME_TYPES).not.toContain("image/svg+xml");
  });

  it("caps uploads at 5MB", () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });
});
