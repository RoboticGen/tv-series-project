import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongo";
import { stepsFromLegacyBody, type Step } from "@/lib/steps";

// The step-by-step write-up of every project and submission, keyed by the
// Mongo _id stored in Postgres as projects.content_doc_id /
// submissions.content_doc_id. One collection for both -- ownerType/ownerId
// are informational only (debugging/backfill), never queried relationally.
// See docs/features.md §5.
interface ContentDoc {
  _id: ObjectId;
  ownerType: "project" | "submission";
  ownerId: string;
  steps?: Step[];
  // Pre-steps docs stored a single Markdown string. Read-only: converted
  // by getContentDoc and dropped on the next update.
  body?: string;
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
  steps: Step[],
): Promise<string> {
  const collection = await getCollection();
  const now = new Date();
  const result = await collection.insertOne({
    _id: new ObjectId(),
    ownerType,
    ownerId,
    steps,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toString();
}

export async function getContentDoc(id: string): Promise<Step[] | null> {
  const collection = await getCollection();
  const doc = await collection.findOne(
    { _id: new ObjectId(id) },
    { projection: { steps: 1, body: 1 } },
  );
  if (!doc) return null;
  return doc.steps ?? stepsFromLegacyBody(doc.body ?? "");
}

export async function updateContentDoc(
  id: string,
  steps: Step[],
): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { steps, updatedAt: new Date() }, $unset: { body: "" } },
  );
}

export async function deleteContentDoc(id: string): Promise<void> {
  const collection = await getCollection();
  await collection.deleteOne({ _id: new ObjectId(id) });
}
