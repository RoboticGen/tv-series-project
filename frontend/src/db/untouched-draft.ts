import { and, eq, sql } from "drizzle-orm";
import { projects } from "@/db/schema";

// "New project" creates the row up front (uploads need a project id), so a
// user who opens the editor and walks away leaves an empty "Untitled
// project" behind. A draft counts as untouched when it has never been saved
// -- trg_projects_updated_at bumps updated_at on any UPDATE (save, cover
// change), so it still equals created_at -- and nothing was uploaded to it.
// Such drafts are hidden from the author's lists/counts and reused by the
// next "New project" instead of piling up.
export const untouchedDraft = and(
  eq(projects.status, "draft"),
  sql`${projects.updatedAt} = ${projects.createdAt}`,
  sql`NOT EXISTS (
    SELECT 1 FROM media_assets m
    WHERE m.owner_type = 'project' AND m.owner_id = ${projects.id}
  )`,
)!;
