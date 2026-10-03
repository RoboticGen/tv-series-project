import "server-only";
import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const promise = new MongoClient(process.env.MONGODB_URI!).connect();

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
