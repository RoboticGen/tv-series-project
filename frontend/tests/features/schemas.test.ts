import { describe, expect, it } from "vitest";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/features/editor/image-rules";
import { createCollectionSchema } from "@/features/collections/schemas";
import { createCommentSchema } from "@/features/comments/schemas";
import { createProjectSchema } from "@/features/projects/schemas";
import { createSubmissionSchema } from "@/features/submissions/schemas";
import { isPlainWriteUp, stepsFromLegacyBody, stepsSchema, type Step } from "@/lib/models/steps";

function step(overrides: Partial<Step> = {}): Step {
  return { id: "s1", title: "", images: [], body: "", ...overrides };
}

describe("createProjectSchema", () => {
  const valid = {
    title: "My Robot Project",
    summary: "A summary that is definitely long enough.",
    category: "robotics",
    steps: [step({ body: "A write-up body that is long enough to pass validation." })],
  };

  it("accepts a valid payload", () => {
    expect(createProjectSchema.parse(valid)).toMatchObject(valid);
  });

  it("trims title/summary", () => {
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

  it("rejects steps with fewer than 20 characters of text", () => {
    expect(() =>
      createProjectSchema.parse({ ...valid, steps: [step({ body: "short body" })] }),
    ).toThrow();
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
  it("accepts steps with >= 20 chars with isPrivate omitted", () => {
    const parsed = createSubmissionSchema.parse({ steps: [step({ body: "a".repeat(20) })] });
    expect(parsed.steps[0].body).toHaveLength(20);
    expect(parsed.isPrivate).toBeUndefined();
  });

  it("rejects steps under 20 chars", () => {
    expect(() => createSubmissionSchema.parse({ steps: [step({ body: "too short" })] })).toThrow();
  });

  it("accepts an explicit isPrivate boolean", () => {
    expect(
      createSubmissionSchema.parse({ steps: [step({ body: "a".repeat(20) })], isPrivate: false })
        .isPrivate,
    ).toBe(false);
  });
});

describe("stepsSchema", () => {
  it("rejects an empty list", () => {
    expect(() => stepsSchema.parse([])).toThrow();
  });

  it("counts text across all step titles and bodies", () => {
    const steps = [step({ id: "a", title: "Gather parts" }), step({ id: "b", body: "Wire it up" })];
    expect(() => stepsSchema.parse(steps)).not.toThrow();
  });

  it("trims step titles and bodies", () => {
    const [parsed] = stepsSchema.parse([step({ title: "  Title  ", body: "  " + "a".repeat(20) })]);
    expect(parsed.title).toBe("Title");
    expect(parsed.body).toBe("a".repeat(20));
  });

  it("accepts media-route image URLs", () => {
    const images = ["/api/media/123e4567-e89b-12d3-a456-426614174000"];
    expect(() => stepsSchema.parse([step({ body: "a".repeat(20), images })])).not.toThrow();
  });

  it("rejects external image URLs", () => {
    const images = ["https://example.com/cat.png"];
    expect(() => stepsSchema.parse([step({ body: "a".repeat(20), images })])).toThrow();
  });
});

describe("legacy Markdown bodies", () => {
  it("become a single plain step", () => {
    const steps = stepsFromLegacyBody("# Old write-up");
    expect(steps).toEqual([step({ id: "step-legacy", body: "# Old write-up" })]);
    expect(isPlainWriteUp(steps)).toBe(true);
  });

  it("titled or multi-step write-ups are not plain", () => {
    expect(isPlainWriteUp([step({ title: "Intro" })])).toBe(false);
    expect(isPlainWriteUp([step({ id: "a" }), step({ id: "b" })])).toBe(false);
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
