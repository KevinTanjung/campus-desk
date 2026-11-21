import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
import { getAuth } from "../lib/auth";
import { client as appClient } from "../lib/db";
const base = process.env.BETTER_AUTH_URL!;
assert.equal(
  new URL(base).hostname,
  "127.0.0.1",
  "Integration tests must use a local server.",
);
assert.match(
  process.env.MONGODB_URI!,
  /^mongodb:\/\/127\.0\.0\.1:/,
  "Integration tests require a local database.",
);
const mongo = new MongoClient(process.env.MONGODB_URI!),
  db = mongo.db(process.env.MONGODB_DB || "campus_desk");
const tag = Date.now().toString(),
  createdIds: string[] = [],
  categoryIds: string[] = [],
  userIds: string[] = [];
const password = "CampusTest!" + tag;
let assertions = 0;
function equal(actual: unknown, expected: unknown) {
  assert.deepEqual(actual, expected);
  assertions++;
}
async function call(
  path: string,
  cookie = "",
  method = "GET",
  body?: unknown,
  extra: Record<string, string> = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      origin: base,
      cookie,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}
async function account(name: string, role = "student") {
  const email = `${name.toLowerCase().replaceAll(" ", "-")}-${tag}@example.test`;
  const result = await (
    await getAuth()
  ).api.signUpEmail({ body: { name, email, password } });
  userIds.push(result.user.id);
  if (role === "staff")
    await db
      .collection("user")
      .updateOne({ _id: new ObjectId(result.user.id) }, { $set: { role } });
  const { response, data } = await call("/api/auth/sign-in/email", "", "POST", {
    email,
    password,
  });
  equal(response.status, 200);
  const cookie = response.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  assert(cookie);
  return { email, cookie, id: result.user.id, ...data };
}
try {
  // The local database is dedicated to synthetic verification data.
  await db.collection("rateLimit").deleteMany({});
  const student = await account("Student A"),
    other = await account("Student B"),
    staff = await account("Campus Staff", "staff");
  equal((await call("/api/requests")).response.status, 401);
  equal(
    (
      await call("/api/categories", student.cookie, "POST", {
        name: "Forbidden",
      })
    ).response.status,
    403,
  );
  equal(
    (
      await call("/api/auth/sign-up/email", "", "POST", {
        name: "Bad role",
        email: `role-${tag}@example.test`,
        password,
        role: "staff",
      })
    ).response.status,
    400,
  );
  equal(
    (
      await call("/api/auth/sign-up/email", "", "POST", {
        name: "Short password",
        email: `short-${tag}@example.test`,
        password: "short",
      })
    ).response.status,
    400,
  );
  const createCat = async (name: string) => {
    const r = await call("/api/categories", staff.cookie, "POST", { name });
    equal(r.response.status, 201);
    categoryIds.push(r.data.data.id);
    return r.data.data;
  };
  const category = await createCat(`Transcripts ${tag}`),
    unused = await createCat(`Unused ${tag}`);
  equal(
    (
      await call("/api/categories", staff.cookie, "POST", {
        name: `  TRANSCRIPTS ${tag} `,
      })
    ).response.status,
    409,
  );
  const input = {
    title: "Official transcript request",
    description: "Please prepare a transcript for my internship application.",
    categoryId: category.id,
  };
  const made = await call("/api/requests", student.cookie, "POST", input);
  equal(made.response.status, 201);
  const id = made.data.data.id;
  createdIds.push(id);
  equal(made.data.data.status, "open");
  equal(made.data.data.reporter.id, student.id);
  equal((await call(`/api/requests/${id}`, other.cookie)).response.status, 404);
  equal(
    (
      await call(`/api/requests/${id}`, other.cookie, "PATCH", {
        title: "Other student edit",
      })
    ).response.status,
    404,
  );
  equal(
    (await call(`/api/requests/${id}`, other.cookie, "DELETE")).response.status,
    404,
  );
  equal((await call("/api/requests", other.cookie)).data.total, 0);
  equal((await call("/api/dashboard", other.cookie)).data.data.counts.total, 0);
  equal(
    (
      await call("/api/requests", student.cookie, "POST", {
        ...input,
        reporterId: other.id,
      })
    ).response.status,
    400,
  );
  equal(
    (
      await call("/api/requests", student.cookie, "POST", {
        ...input,
        title: { $ne: "" },
      })
    ).response.status,
    400,
  );
  equal(
    (await call("/api/requests?page=0", student.cookie)).response.status,
    400,
  );
  equal(
    (await call("/api/requests?unknown=1", student.cookie)).response.status,
    400,
  );
  equal(
    (await call("/api/requests?categoryId=bad", student.cookie)).response
      .status,
    400,
  );
  equal((await call("/api/requests?q=%5B", student.cookie)).data.total, 0);
  equal(
    (
      await call(`/api/requests/${id}`, student.cookie, "PATCH", {
        title: "Updated transcript request",
      })
    ).response.status,
    200,
  );
  equal(
    (await call(`/api/categories/${category.id}`, staff.cookie, "DELETE"))
      .response.status,
    409,
  );
  equal(
    (
      await call(`/api/categories/${category.id}`, staff.cookie, "PATCH", {
        active: false,
      })
    ).response.status,
    200,
  );
  equal(
    (await call("/api/categories", student.cookie)).data.data.some(
      (c: { id: string }) => c.id === category.id,
    ),
    false,
  );
  equal(
    (
      await call(`/api/requests/${id}`, student.cookie, "PATCH", {
        title: "Keep inactive transcript category",
      })
    ).response.status,
    200,
  );
  equal(
    (await call("/api/requests", student.cookie, "POST", input)).response
      .status,
    400,
  );
  equal(
    (
      await call(`/api/categories/${category.id}`, staff.cookie, "PATCH", {
        active: true,
      })
    ).response.status,
    200,
  );
  equal(
    (
      await call(`/api/requests/${id}/status`, student.cookie, "PATCH", {
        status: "in_progress",
      })
    ).response.status,
    403,
  );
  equal(
    (
      await call(`/api/requests/${id}/status`, staff.cookie, "PATCH", {
        status: "resolved",
        resolutionNote: "Completed.",
      })
    ).response.status,
    409,
  );
  const race = await Promise.all([
    call(`/api/requests/${id}/status`, staff.cookie, "PATCH", {
      status: "in_progress",
    }),
    call(`/api/requests/${id}`, student.cookie, "PATCH", {
      title: "Concurrent transcript edit",
    }),
  ]);
  equal(race[0].response.status, 200);
  assert([200, 409].includes(race[1].response.status));
  assertions++;
  equal(
    (
      await call(`/api/requests/${id}`, student.cookie, "PATCH", {
        title: "Locked edit",
      })
    ).response.status,
    409,
  );
  equal(
    (await call(`/api/requests/${id}`, student.cookie, "DELETE")).response
      .status,
    409,
  );
  equal(
    (
      await call(`/api/requests/${id}/status`, staff.cookie, "PATCH", {
        status: "resolved",
      })
    ).response.status,
    400,
  );
  const resolved = await call(
    `/api/requests/${id}/status`,
    staff.cookie,
    "PATCH",
    {
      status: "resolved",
      resolutionNote: "Ready for collection at Student Services.",
    },
  );
  equal(resolved.response.status, 200);
  assert(resolved.data.data.resolvedAt);
  assertions++;
  const second = await call("/api/requests", student.cookie, "POST", {
    ...input,
    title: "Another transcript request",
  });
  equal(second.response.status, 201);
  createdIds.push(second.data.data.id);
  for (const [sort, titles] of [
    ["title_asc", ["Another transcript request"]],
    [
      "title_desc",
      [(await call(`/api/requests/${id}`, student.cookie)).data.data.title],
    ],
  ] as const) {
    const list = await call(
      `/api/requests?sort=${sort}&pageSize=1`,
      student.cookie,
    );
    equal(list.data.data[0].title, titles[0]);
    equal(list.data.total, 2);
  }
  equal(
    (await call("/api/requests?sort=oldest&pageSize=1", student.cookie)).data
      .data[0].id,
    id,
  );
  equal(
    (await call("/api/requests?sort=newest&pageSize=1", student.cookie)).data
      .data[0].id,
    second.data.data.id,
  );
  equal(
    (
      await call(
        `/api/requests?status=resolved&categoryId=${category.id}&q=transcript`,
        student.cookie,
      )
    ).data.total,
    1,
  );
  const dash = (await call("/api/dashboard", student.cookie)).data.data;
  equal(dash.counts, { total: 2, open: 1, inProgress: 0, resolved: 1 });
  equal(dash.recentRequests[0].id, second.data.data.id);
  equal(
    (
      await call(
        `/api/requests/${second.data.data.id}`,
        student.cookie,
        "DELETE",
      )
    ).response.status,
    204,
  );
  equal(
    (await call(`/api/categories/${unused.id}`, staff.cookie, "DELETE"))
      .response.status,
    204,
  );
  equal(
    (
      await call(
        "/api/categories",
        staff.cookie,
        "POST",
        { name: "Foreign origin" },
        { origin: "https://other.example" },
      )
    ).response.status,
    403,
  );
  equal(
    (
      await call("/api/requests", student.cookie, "POST", {
        ...input,
        description: "a".repeat(17000),
      })
    ).response.status,
    413,
  );
  const malformed = await fetch(base + "/api/requests", {
    method: "POST",
    headers: {
      origin: base,
      cookie: student.cookie,
      "content-type": "application/json",
    },
    body: "{",
  });
  equal(malformed.status, 400);
  const categoryRace = await createCat(`Race ${tag}`);
  const racing = await Promise.all([
    call("/api/requests", student.cookie, "POST", {
      ...input,
      categoryId: categoryRace.id,
    }),
    call(`/api/categories/${categoryRace.id}`, staff.cookie, "DELETE"),
  ]);
  if (racing[0].response.status === 201) {
    createdIds.push(racing[0].data.data.id);
    equal(racing[1].response.status, 409);
    assert(
      await db
        .collection("categories")
        .findOne({ _id: new ObjectId(categoryRace.id) }),
    );
  } else {
    equal(racing[0].response.status, 400);
    equal(racing[1].response.status, 204);
  }
  const cookies = (await call("/api/auth/get-session", student.cookie)).response
    .headers;
  equal(cookies.get("cache-control"), "private, no-store");
  await db
    .collection("user")
    .updateOne({ _id: new ObjectId(other.id) }, { $set: { role: "staff" } });
  equal(
    (
      await call("/api/categories", other.cookie, "POST", {
        name: `Promoted ${tag}`,
      })
    ).response.status,
    201,
  );
  const promoted = await db
    .collection("categories")
    .findOne({ name: `Promoted ${tag}` });
  if (promoted) categoryIds.push(promoted._id.toString());
  await db
    .collection("user")
    .updateOne({ _id: new ObjectId(other.id) }, { $set: { role: "student" } });
  equal(
    (
      await call("/api/categories", other.cookie, "POST", {
        name: "Stale role",
      })
    ).response.status,
    403,
  );
  await call("/api/auth/sign-out", student.cookie, "POST", {});
  equal((await call("/api/requests", student.cookie)).response.status, 401);
  await db
    .collection("session")
    .updateMany(
      { userId: new ObjectId(other.id) },
      { $set: { expiresAt: new Date(0) } },
    );
  await db
    .collection("session")
    .updateMany({ userId: other.id }, { $set: { expiresAt: new Date(0) } });
  equal((await call("/api/requests", other.cookie)).response.status, 401);
  await db.collection("rateLimit").deleteMany({});
  for (let i = 0; i < 5; i++)
    equal(
      (
        await call("/api/auth/sign-in/email", "", "POST", {
          email: other.email,
          password: "wrong-password",
        })
      ).response.status,
      401,
    );
  equal(
    (
      await call("/api/auth/sign-in/email", "", "POST", {
        email: other.email,
        password: "wrong-password",
      })
    ).response.status,
    429,
  );
  console.log(
    `PASS: ${assertions} API assertions including ownership, transitions, concurrency, validation, logout, expiry and rate limiting.`,
  );
} finally {
  await db
    .collection("requests")
    .deleteMany({ _id: { $in: createdIds.map((id) => new ObjectId(id)) } });
  await db
    .collection("categories")
    .deleteMany({ _id: { $in: categoryIds.map((id) => new ObjectId(id)) } });
  await db
    .collection("user")
    .deleteMany({ _id: { $in: userIds.map((id) => new ObjectId(id)) } });
  for (const name of ["account", "session"])
    await db
      .collection(name)
      .deleteMany({
        userId: { $in: [...userIds, ...userIds.map((id) => new ObjectId(id))] },
      });
  await db.collection("rateLimit").deleteMany({});
  await mongo.close();
  await appClient().close();
}
