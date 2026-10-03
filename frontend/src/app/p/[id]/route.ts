import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Permanent link for printed QR codes
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });

  const [project] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.status, "published")));
  if (!project) return new Response(null, { status: 404 });

  return new Response(null, { status: 307, headers: { Location: `/projects/${project.slug}` } });
}
