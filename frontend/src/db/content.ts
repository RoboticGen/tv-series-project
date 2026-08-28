import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongo";

// The Markdown body of every project and submission, keyed by the Mongo
// _id stored in Postgres as projects.content_doc_id / submissions.content_doc_id.
// One collection for both -- ownerType/ownerId are informational only
// (debugging/backfill), never queried relationally. See docs/features.md §5.
interface ContentDoc {
  _id: ObjectId;
  ownerType: "project" | "submission";
  ownerId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection() {
  const db = await getMongoDb();
  return db.collection<ContentDoc>("content_docs");
}

export async function createContentDoc(
  ownerType: "project" | "submission",
  ownerId: string,
  body: string,
): Promise<string> {
  const collection = await getCollection();
  const now = new Date();
  const result = await collection.insertOne({
    _id: new ObjectId(),
    ownerType,
    ownerId,
    body,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toString();
}

export async function getContentDoc(id: string): Promise<string | null> {
  const collection = await getCollection();
  const doc = await collection.findOne(
    { _id: new ObjectId(id) },
    { projection: { body: 1 } },
  );
  return doc?.body ?? null;
}

export async function updateContentDoc(
  id: string,
  body: string,
): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { body, updatedAt: new Date() } },
  );
}
