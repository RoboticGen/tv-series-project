import { z } from "zod";

export const createCollectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give your collection a title of at least 3 characters")
    .max(120, "Keep the title under 120 characters"),
  description: z.string().trim().max(500, "Keep the description under 500 characters").optional(),
  isPrivate: z.boolean().optional(),
});
export type CollectionFormValues = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema;
