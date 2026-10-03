import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000, "Keep comments under 2000 characters"),
});
