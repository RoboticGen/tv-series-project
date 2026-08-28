import { MongoClient, type Db } from "mongodb";

// Cached on globalThis so Next.js dev-mode hot reload reuses the same
// connection instead of opening a new one on every module reload --
// mirrors the pattern in frontend/src/db/index.ts for the Postgres client.
// In production the module is only evaluated once per process, so a plain
// module-scoped promise is enough there.
const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  process.env.NODE_ENV !== "production"
    ? (globalForMongo.mongoClientPromise ??= new MongoClient(
        process.env.MONGODB_URI!,
      ).connect())
    : new MongoClient(process.env.MONGODB_URI!).connect();

export async function getMongoDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}
