"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { collectionItems, collections, projects, users } from "@/db/schema";
import { slugify, randomSlugSuffix } from "@/lib/slug";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session;
}

async function generateUniqueSlug(title: string) {
  const base = slugify(title);
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, base));
  return existing ? `${base}-${randomSlugSuffix()}` : base;
}

async function requireOwnedCollection(collectionId: string, userId: string) {
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId));
  if (!collection || collection.ownerId !== userId) {
    throw new Error("Not authorized to manage this collection");
  }
  return collection;
}

export async function createCollection(input: {
  title: string;
  description?: string;
  isPrivate?: boolean;
}) {
  const session = await requireSession();
  const parsed = createCollectionSchema.parse(input);

  const slug = await generateUniqueSlug(parsed.title);
  const [collection] = await db
    .insert(collections)
    .values({
      ownerId: session.user.id,
      title: parsed.title,
      slug,
      description: parsed.description || null,
      isPrivate: parsed.isPrivate ?? false,
    })
    .returning({ id: collections.id, slug: collections.slug });

  revalidatePath("/dashboard");
  return collection;
}

export async function updateCollection(
  collectionId: string,
  input: { title: string; description?: string; isPrivate?: boolean },
) {
  const session = await requireSession();
  const parsed = updateCollectionSchema.parse(input);
  const collection = await requireOwnedCollection(collectionId, session.user.id);

  let slug = collection.slug;
  if (parsed.title !== collection.title) {
    slug = await generateUniqueSlug(parsed.title);
  }

  await db
    .update(collections)
    .set({
      title: parsed.title,
      description: parsed.description || null,
      isPrivate: parsed.isPrivate ?? false,
      slug,
    })
    .where(eq(collections.id, collectionId));

  revalidatePath(`/collections/${collection.slug}`);
  revalidatePath(`/collections/${slug}`);
  revalidatePath("/dashboard");

  return { slug };
}

export async function deleteCollection(collectionId: string) {
  const session = await requireSession();
  const collection = await requireOwnedCollection(collectionId, session.user.id);

  await db.delete(collections).where(eq(collections.id, collectionId));

  revalidatePath("/dashboard");
  return { slug: collection.slug };
}

export async function toggleProjectInCollection(collectionId: string, projectId: string) {
  const session = await requireSession();
  const collection = await requireOwnedCollection(collectionId, session.user.id);

  const [existing] = await db
    .select()
    .from(collectionItems)
    .where(
      and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.projectId, projectId)),
    );

  if (existing) {
    await db
      .delete(collectionItems)
      .where(
        and(eq(collectionItems.collectionId, collectionId), eq(collectionItems.projectId, projectId)),
      );
  } else {
    const currentItems = await db
      .select({ id: collectionItems.projectId })
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));
    await db.insert(collectionItems).values({
      collectionId,
      projectId,
      position: currentItems.length,
    });
  }

  revalidatePath(`/collections/${collection.slug}`);
  revalidatePath("/dashboard");

  return { added: !existing };
}

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

  // One extra query for cover images rather than a per-row join -- a user's
  // own collection count is small, and this keeps the main query a simple
  // scan of idx_collections_owner.
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

// Called directly from the client "Add to Collection" picker, so it
// authenticates itself rather than trusting a caller-supplied userId.
export async function getCollectionsForProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
    })
    .from(collections)
    .where(eq(collections.ownerId, userId))
    .orderBy(desc(collections.createdAt));

  if (rows.length === 0) return [];

  const memberships = await db
    .select({ collectionId: collectionItems.collectionId })
    .from(collectionItems)
    .where(
      and(
        eq(collectionItems.projectId, projectId),
        inArray(
          collectionItems.collectionId,
          rows.map((r) => r.id),
        ),
      ),
    );
  const memberSet = new Set(memberships.map((m) => m.collectionId));

  return rows.map((row) => ({
    ...row,
    containsProject: memberSet.has(row.id),
  }));
}
