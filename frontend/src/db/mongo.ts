import { MongoClient, type Db } from "mongodb";

// Cached on globalThis so Next.js dev-mode hot reload reuses the same
// connection instead of opening a new one on every module reload --
// mirrors the pattern in frontend/src/db/index.ts for the Postgres client.
// In production the module is only evaluated once per process, so the
// module-scoped cache below behaves the same way.
const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const promise = new MongoClient(process.env.MONGODB_URI!).connect();
  // Don't cache a failed connection: if Mongo wasn't up yet (e.g. the
  // container is still starting), the next request retries instead of
  // rethrowing the same ECONNREFUSED until the server restarts.
  promise.catch(() => {
    if (globalForMongo.mongoClientPromise === promise) {
      globalForMongo.mongoClientPromise = undefined;
    }
  });
  return promise;
}

export async function getMongoDb(): Promise<Db> {
  globalForMongo.mongoClientPromise ??= connect();
  const client = await globalForMongo.mongoClientPromise;
  return client.db(process.env.MONGODB_DB);
}
