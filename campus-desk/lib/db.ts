import { MongoClient, ObjectId } from "mongodb";
import type { Status } from "./types";
export type CategoryDoc = {
  _id: ObjectId;
  name: string;
  nameKey: string;
  active: boolean;
  referenceVersion: number;
  createdAt: Date;
  updatedAt: Date;
};
export type RequestDoc = {
  _id: ObjectId;
  reporterId: string;
  categoryId: ObjectId;
  title: string;
  description: string;
  location: string;
  status: Status;
  resolutionNote: string;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
const globalDb = globalThis as typeof globalThis & {
  campusMongo?: MongoClient;
  campusIndexes?: Promise<void>;
};
export function client() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  return (globalDb.campusMongo ??= new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
    socketTimeoutMS: 10000,
    maxPoolSize: 20,
  }));
}
export function database() {
  return client().db(process.env.MONGODB_DB || "campus_desk");
}
export const categories = () =>
  database().collection<CategoryDoc>("categories");
export const requests = () => database().collection<RequestDoc>("requests");
export function ensureIndexes() {
  return (globalDb.campusIndexes ??= (async () => {
    await Promise.all([
      categories().createIndex({ nameKey: 1 }, { unique: true }),
      requests().createIndex({ reporterId: 1, createdAt: -1, _id: -1 }),
      requests().createIndex({ status: 1, createdAt: -1, _id: -1 }),
      requests().createIndex({ categoryId: 1 }),
      database().collection("user").createIndex({ email: 1 }, { unique: true }),
      database()
        .collection("session")
        .createIndex({ token: 1 }, { unique: true }),
      database().collection("session").createIndex({ userId: 1 }),
      database()
        .collection("session")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database().collection("account").createIndex({ userId: 1 }),
      database()
        .collection("account")
        .createIndex({ providerId: 1, accountId: 1 }, { unique: true }),
      database()
        .collection("rateLimit")
        .createIndex({ key: 1 }, { unique: true }),
    ]);
  })().catch((error) => {
    globalDb.campusIndexes = undefined;
    throw error;
  }));
}
