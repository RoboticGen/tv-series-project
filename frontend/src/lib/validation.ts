import { z } from "zod";
import { projectCategory } from "@/db/schema";

export const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(500),
  category: z.enum(projectCategory.enumValues),
  body: z.string().trim().min(20),
});

export const updateProjectSchema = createProjectSchema;

export const createSubmissionSchema = z.object({
  body: z.string().trim().min(20),
  isPrivate: z.boolean().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const createCollectionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

export const updateCollectionSchema = createCollectionSchema;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
