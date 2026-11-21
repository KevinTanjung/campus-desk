import { client, database, ensureIndexes } from "../lib/db";
try {
  const hello = await database().admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error(
      "MongoDB must run as a replica set to support transactions.",
    );
  await ensureIndexes();
  console.log("Campus Desk database and indexes are ready.");
} finally {
  await client().close();
}
