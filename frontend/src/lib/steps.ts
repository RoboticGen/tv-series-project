import { z } from "zod";

// Project and submission write-ups are an ordered list of Instructables-
// style steps: a title, an image gallery, and a Markdown body. Stored as
// the `steps` array of a content_docs document (see src/db/content.ts).

// Gallery images must be our own uploads, served through the
// ownership-checked media route -- never arbitrary external URLs.
const MEDIA_URL_PATTERN = /^\/api\/media\/[0-9a-f-]{36}$/i;

export const MAX_STEPS = 50;
export const MAX_IMAGES_PER_STEP = 12;

export const stepSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().max(120),
  images: z.array(z.string().regex(MEDIA_URL_PATTERN)).max(MAX_IMAGES_PER_STEP),
  body: z.string().trim(),
});

export type Step = z.infer<typeof stepSchema>;

// At least one step, and at least 20 characters of actual text across all
// step titles/bodies -- the same minimum the old single Markdown body had.
export const stepsSchema = z
  .array(stepSchema)
  .min(1)
  .max(MAX_STEPS)
  .refine(
    (steps) => steps.reduce((n, s) => n + s.title.length + s.body.length, 0) >= 20,
    { message: "Write at least 20 characters across your steps" },
  );

export function newStep(): Step {
  return {
    id: `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    images: [],
    body: "",
  };
}

// Docs written before steps existed hold a single Markdown string -- show
// it as one untitled step; it's saved as steps on the author's next save.
export function stepsFromLegacyBody(body: string): Step[] {
  return [{ id: "step-legacy", title: "", images: [], body }];
}

// A lone untitled, image-less step (legacy doc, or a short write-up) reads
// better as plain Markdown than as "Step 1".
export function isPlainWriteUp(steps: Step[]): boolean {
  return steps.length === 1 && !steps[0].title && steps[0].images.length === 0;
}
