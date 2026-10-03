import { z } from "zod";
import { stepsFormSchema, stepsSchema } from "@/lib/models/steps";

export const createSubmissionSchema = z.object({
  steps: stepsSchema,
  isPrivate: z.boolean().optional(),
});

export const submissionFormSchema = z.object({ steps: stepsFormSchema, isPublic: z.boolean() });
export type SubmissionFormValues = z.infer<typeof submissionFormSchema>;
