import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { collectionItems, collections, projects, users } from "@/lib/db/schema";

export async function getMyCollections(userId: string) {
  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      slug: collections.slug,
      description: collections.description,
      isPrivate: collections.isPrivate,
      itemCount: collections.itemCount,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .where(eq(collections.ownerId, userId))
    .orderBy(desc(collections.createdAt));

  if (rows.length === 0) return [];

  const firstItems = await db
    .select({
      collectionId: collectionItems.collectionId,
      position: collectionItems.position,
      coverImageId: projects.coverImageId,
    })
    .from(collectionItems)
    .innerJoin(projects, eq(collectionItems.projectId, projects.id))
    .where(
      inArray(
        collectionItems.collectionId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(collectionItems.position));

  const coversByCollection = new Map<string, string[]>();
  for (const item of firstItems) {
    const covers = coversByCollection.get(item.collectionId) ?? [];
    if (covers.length < 4 && item.coverImageId) {
      covers.push(`/api/media/${item.coverImageId}`);
    }
    coversByCollection.set(item.collectionId, covers);
  }

  return rows.map((row) => ({
    ...row,
    coverImageUrls: coversByCollection.get(row.id) ?? [],
  }));
}

export async function getCollectionBySlug(slug: string, viewerId?: string) {
  const [collection] = await db
    .select({
      id: collections.id,
      ownerId: collections.ownerId,
      ownerName: users.displayName,
      title: collections.title,
      slug: collections.slug,
      description: collections.description,
      isPrivate: collections.isPrivate,
      itemCount: collections.itemCount,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .innerJoin(users, eq(collections.ownerId, users.id))
    .where(eq(collections.slug, slug));

  if (!collection) return null;
  if (collection.isPrivate && collection.ownerId !== viewerId) return null;

  const items = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      category: projects.category,
      likeCount: projects.likeCount,
      starCount: projects.starCount,
      authorName: users.displayName,
      coverImageId: projects.coverImageId,
    })
    .from(collectionItems)
    .innerJoin(projects, eq(collectionItems.projectId, projects.id))
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(and(eq(collectionItems.collectionId, collection.id), eq(projects.status, "published")))
    .orderBy(asc(collectionItems.position));

  return {
    ...collection,
    projects: items.map(({ coverImageId, ...row }) => ({
      ...row,
      coverImageUrl: coverImageId ? `/api/media/${coverImageId}` : null,
    })),
  };
}
