import { and, eq, sql } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

export const untouchedDraft = and(
  eq(projects.status, "draft"),
  sql`${projects.updatedAt} = ${projects.createdAt}`,
  sql`NOT EXISTS (
    SELECT 1 FROM media_assets m
    WHERE m.owner_type = 'project' AND m.owner_id = ${projects.id}
  )`,
)!;
