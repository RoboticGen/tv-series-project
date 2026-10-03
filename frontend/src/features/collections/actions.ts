"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collectionItems, collections } from "@/lib/db/schema";
import { slugify, randomSlugSuffix } from "@/shared/lib/slug";
import { createCollectionSchema, updateCollectionSchema } from "@/features/collections/schemas";
import { requireSession } from "@/lib/auth/session";

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
