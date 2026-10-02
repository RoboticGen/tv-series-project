import type { MetadataRoute } from "next";
import { and, eq, gt, max } from "drizzle-orm";
import { db } from "@/db";
import { collections, projects, users } from "@/db/schema";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectRows, authorRows, collectionRows] = await Promise.all([
    db
      .select({ slug: projects.slug, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.status, "published")),
    db
      .select({ id: users.id, lastPublished: max(projects.updatedAt) })
      .from(users)
      .innerJoin(projects, and(eq(projects.authorId, users.id), eq(projects.status, "published")))
      .where(eq(users.isDisabled, false))
      .groupBy(users.id),
    db
      .select({ slug: collections.slug, updatedAt: collections.updatedAt })
      .from(collections)
      .where(and(eq(collections.isPrivate, false), gt(collections.itemCount, 0))),
  ]);

  const latestProject = projectRows.reduce<Date | undefined>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    undefined,
  );

  return [
    { url: `${SITE_URL}/`, lastModified: latestProject, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/projects`, lastModified: latestProject, changeFrequency: "daily", priority: 0.9 },
    ...projectRows.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...authorRows.map((a) => ({
      url: `${SITE_URL}/authors/${a.id}`,
      lastModified: a.lastPublished ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...collectionRows.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
