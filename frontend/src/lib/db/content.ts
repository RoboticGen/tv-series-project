import "server-only";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongo";
import { stepsFromLegacyBody, type Step } from "@/lib/models/steps";


interface ContentDoc {
  _id: ObjectId;
  ownerType: "project" | "submission";
  ownerId: string;
  steps?: Step[];
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
