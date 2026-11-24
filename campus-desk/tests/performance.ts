import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
import { getAuth } from "../lib/auth";
import { client } from "../lib/db";
const base = process.env.BETTER_AUTH_URL!;
assert.equal(new URL(base).hostname, "127.0.0.1");
assert.equal(new URL(base).port, "3001");
assert.match(process.env.MONGODB_URI!, /^mongodb:\/\/127\.0\.0\.1:/);
assert.match(process.env.MONGODB_DB || "", /^campus_desk_test(?:_|$)/);
const mongo = new MongoClient(process.env.MONGODB_URI!),
  db = mongo.db(process.env.MONGODB_DB),
  tag = Date.now().toString(),
  userIds: string[] = [],
  cookies: string[] = [];
const categoryId = new ObjectId(),
  requestIds: ObjectId[] = [];
try {
  const auth = await getAuth();
  for (let i = 0; i < 10; i++) {
    const name = `Load Student ${i}`,
      email = `load-${tag}-${i}@example.test`,
      password = `Performance!${tag}`;
    const user = await auth.api.signUpEmail({
      body: { name, email, password },
    });
    userIds.push(user.user.id);
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    cookies.push(
      response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; "),
    );
  }
  const now = new Date();
  await db
    .collection("categories")
    .insertOne({
      _id: categoryId,
      name: `Load ${tag}`,
      nameKey: `load ${tag}`,
      active: true,
      referenceVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  const rows = Array.from({ length: 1000 }, (_, i) => {
    const _id = new ObjectId();
    requestIds.push(_id);
    return {
      _id,
      reporterId: userIds[i % 10],
      categoryId,
      title: `Load request ${i.toString().padStart(4, "0")}`,
      description: "Synthetic request for the local performance check.",
      location: "Test counter",
      status: "open",
      resolutionNote: "",
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  });
  await db.collection("requests").insertMany(rows);
  const durations: number[] = [];
  async function read(cookie: string, path: string) {
    const start = performance.now(),
      response = await fetch(base + path, { headers: { cookie } });
    assert.equal(response.status, 200);
    await response.json();
    return performance.now() - start;
  }
  const cold = await read(cookies[0], "/api/dashboard");
  await Promise.all(cookies.map((cookie) => read(cookie, "/api/requests")));
  await Promise.all(
    cookies.map(async (cookie) => {
      for (let i = 0; i < 10; i++)
        durations.push(
          await read(cookie, i % 2 ? "/api/dashboard" : "/api/requests"),
        );
    }),
  );
  durations.sort((a, b) => a - b);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  console.log(
    JSON.stringify(
      {
        requests: 1000,
        concurrentUsers: 10,
        warmedReads: durations.length,
        p95Ms: Math.round(p95),
        firstReadMs: Math.round(cold),
        node: process.version,
      },
      null,
      2,
    ),
  );
  assert(p95 < 2000, `p95 ${p95}ms exceeds the 2000ms target.`);
} finally {
  await db.collection("requests").deleteMany({ _id: { $in: requestIds } });
  await db.collection("categories").deleteOne({ _id: categoryId });
  await db
    .collection("user")
    .deleteMany({ _id: { $in: userIds.map((id) => new ObjectId(id)) } });
  for (const name of ["session", "account"])
    await db
      .collection(name)
      .deleteMany({
        userId: { $in: [...userIds, ...userIds.map((id) => new ObjectId(id))] },
      });
  await mongo.close();
  await client().close();
}
