import { z } from "zod";

const MEDIA_URL_PATTERN = /^\/api\/media\/[0-9a-f-]{36}$/i;

export const MAX_STEPS = 50;
export const MAX_IMAGES_PER_STEP = 12;

export const stepSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().max(120, "Keep step titles under 120 characters"),
  images: z.array(z.string().regex(MEDIA_URL_PATTERN)).max(MAX_IMAGES_PER_STEP),
  body: z.string().trim(),
});

export type Step = z.infer<typeof stepSchema>;


const hasEnoughText = (steps: { title: string; body: string }[]) =>
  steps.reduce((n, s) => n + s.title.length + s.body.length, 0) >= 20;
const NOT_ENOUGH_TEXT = { message: "Write at least 20 characters across your steps" };

export const stepsSchema = z
  .array(stepSchema)
  .min(1, "Add at least one step")
  .max(MAX_STEPS, `A write-up can have up to ${MAX_STEPS} steps`)
  .refine(hasEnoughText, NOT_ENOUGH_TEXT);


export const stepsFormSchema = z
  .array(stepSchema.extend({ images: z.array(z.string()).max(MAX_IMAGES_PER_STEP) }))
  .min(1, "Add at least one step")
  .max(MAX_STEPS, `A write-up can have up to ${MAX_STEPS} steps`)
  .refine(hasEnoughText, NOT_ENOUGH_TEXT);

export function newStep(): Step {
  return {
    id: `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    images: [],
    body: "",
  };
}

export function stepsFromLegacyBody(body: string): Step[] {
  return [{ id: "step-legacy", title: "", images: [], body }];
}

export function isPlainWriteUp(steps: Step[]): boolean {
  return steps.length === 1 && !steps[0].title && steps[0].images.length === 0;
}
