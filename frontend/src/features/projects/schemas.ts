import { z } from "zod";
import { projectCategory } from "@/lib/db/schema";
import { stepsFormSchema, stepsSchema } from "@/lib/models/steps";

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give your project a title of at least 3 characters")
    .max(120, "Keep the title under 120 characters"),
  summary: z
    .string()
    .trim()
    .min(10, "Write a summary of at least 10 characters")
    .max(500, "Keep the summary under 500 characters"),
  category: z.enum(projectCategory.enumValues, "Pick a category"),
  steps: stepsSchema,
});

export const updateProjectSchema = createProjectSchema;

export const projectFormSchema = createProjectSchema.extend({ steps: stepsFormSchema });
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
