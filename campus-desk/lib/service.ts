import { ObjectId, type Filter, type Sort, type ClientSession } from "mongodb";
import {
  categories,
  requests,
  client,
  database,
  type RequestDoc,
  type CategoryDoc,
} from "./db";
import { HttpError, requireRole } from "./http";
import {
  objectId,
  requestSchema,
  requestPatchSchema,
  statusSchema,
  categorySchema,
  categoryPatchSchema,
  listSchema,
} from "./validation";
import type { Actor, ServiceRequest, Category, Dashboard } from "./types";

const idOf = (value: string) => new ObjectId(objectId.parse(value));
const missing = () => new HttpError(404, "NOT_FOUND", "Request not found.");
const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
const scope = (actor: Actor): Filter<RequestDoc> => actor.role === "staff" ? {} : { reporterId: actor.id };

function categoryView(row: CategoryDoc): Category {
  return {
    id: row._id.toHexString(),
    name: row.name,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function requestViews(
  rows: RequestDoc[],
  actor: Actor,
  detail = false,
): Promise<ServiceRequest[]> {
  const [names, users] = await Promise.all([
    categories()
      .find({ _id: { $in: rows.map((row) => row.categoryId) } })
      .toArray(),
    actor.role === "staff" || detail
      ? database()
          .collection("user")
          .find(
            {
              $expr: {
                $in: [{ $toString: "$_id" }, rows.map((row) => row.reporterId)],
              },
            },
            { projection: { name: 1 } },
          )
          .toArray()
      : [],
  ]);
  return rows.map((row) => ({
    id: row._id.toHexString(),
    title: row.title,
    location: row.location,
    status: row.status,
    category: {
      id: row.categoryId.toHexString(),
      name:
        names.find((cat) => cat._id.equals(row.categoryId))?.name ||
        "Unavailable category",
    },
    ...(actor.role === "staff" || detail
      ? {
          reporter: {
            id: row.reporterId,
            name:
              users.find((user) => user._id.toString() === row.reporterId)
                ?.name || "Student",
          },
        }
      : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(detail
      ? {
          description: row.description,
          resolutionNote: row.resolutionNote,
          resolvedAt: row.resolvedAt?.toISOString() || null,
        }
      : {}),
  }));
}

async function useCategory(id: ObjectId, session: ClientSession) {
  const result = await categories().updateOne(
    { _id: id, active: true },
    { $inc: { referenceVersion: 1 } },
    { session },
  );
  if (!result.matchedCount) {
    throw new HttpError(400, "VALIDATION_ERROR", "Choose an active category.");
  }
}

export async function getRequest(actor: Actor, id: string) {
  const row = await requests().findOne({ ...scope(actor), _id: idOf(id) });
  if (!row) throw missing();
  return (await requestViews([row], actor, true))[0];
}

export async function listRequests(actor: Actor, input: unknown) {
  const query = listSchema.parse(input);
  const filter: Filter<RequestDoc> = { ...scope(actor) };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.categoryId) {
    filter.categoryId = idOf(query.categoryId);
  }
  if (query.q) {
    filter.title = {
      $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const orders: Record<typeof query.sort, Sort> = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    title_asc: { title: 1, _id: 1 },
    title_desc: { title: -1, _id: -1 },
  };

  const [rows, total] = await Promise.all([
    requests()
      .find(filter)
      .sort(orders[query.sort])
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .toArray(),
    requests().countDocuments(filter),
  ]);

  return {
    data: await requestViews(rows, actor),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function createRequest(actor: Actor, input: unknown) {
  requireRole(actor, "student");
  const data = requestSchema.parse(input);
  const now = new Date();
  const row: RequestDoc = {
    ...data,
    _id: new ObjectId(),
    reporterId: actor.id,
    categoryId: idOf(data.categoryId),
    status: "open",
    resolutionNote: "",
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await client().withSession((session) =>
    session.withTransaction(async () => {
      await useCategory(row.categoryId, session);
      await requests().insertOne(row, { session });
    }),
  );
  return getRequest(actor, row._id.toHexString());
}

export async function editRequest(actor: Actor, id: string, input: unknown) {
  requireRole(actor, "student");
  const data = requestPatchSchema.parse(input);
  const _id = idOf(id);

  await client().withSession((session) =>
    session.withTransaction(async () => {
      const row = await requests().findOne(
        { _id, reporterId: actor.id },
        { session },
      );
      if (!row) {
        throw missing();
      }
      if (row.status !== "open") {
        throw conflict("Only open requests can be edited.");
      }
      const categoryId = data.categoryId
        ? idOf(data.categoryId)
        : row.categoryId;
      if (!categoryId.equals(row.categoryId)) {
        await useCategory(categoryId, session);
      }
      const changed = await requests().updateOne(
        { _id, reporterId: actor.id, status: "open" },
        { $set: { ...data, categoryId, updatedAt: new Date() } },
        { session },
      );
      if (!changed.matchedCount) {
        throw conflict("The request changed. Refresh and try again.");
      }
    }),
  );
  return getRequest(actor, id);
}

export async function deleteRequest(actor: Actor, id: string) {
  requireRole(actor, "student");
  const _id = idOf(id);
  const changed = await requests().deleteOne({
    _id,
    reporterId: actor.id,
    status: "open",
  });
  if (!changed.deletedCount) {
    if (!(await requests().findOne({ _id, reporterId: actor.id }))) {
      throw missing();
    }
    throw conflict("Only open requests can be deleted.");
  }
}

export async function updateStatus(actor: Actor, id: string, input: unknown) {
  requireRole(actor, "staff");
  const data = statusSchema.parse(input),
    now = new Date(),
    _id = idOf(id);
  const previous = data.status === "in_progress" ? "open" : "in_progress";
  const result = await requests().updateOne(
    { _id, status: previous },
    {
      $set: {
        ...data,
        resolvedAt: data.status === "resolved" ? now : null,
        updatedAt: now,
      },
    },
  );
  if (!result.matchedCount) {
    if (!(await requests().findOne({ _id }))) {
      throw missing();
    }
    throw conflict(
      "The request status changed or this transition is not allowed. Refresh and try again.",
    );
  }
  return getRequest(actor, id);
}

export async function listCategories(actor: Actor) {
  return (
    await categories()
      .find(actor.role === "staff" ? {} : { active: true })
      .sort({ name: 1 })
      .toArray()
  ).map(categoryView);
}

export async function createCategory(actor: Actor, input: unknown) {
  requireRole(actor, "staff");
  const data = categorySchema.parse(input);
  const now = new Date();
  const row = {
    ...data,
    _id: new ObjectId(),
    nameKey: data.name.toLowerCase(),
    active: true,
    referenceVersion: 0,
    createdAt: now,
    updatedAt: now,
  };
  await categories().insertOne(row);
  return categoryView(row);
}

export async function editCategory(actor: Actor, id: string, input: unknown) {
  requireRole(actor, "staff");
  const data = categoryPatchSchema.parse(input);
  const row = await categories().findOneAndUpdate(
    { _id: idOf(id) },
    {
      $set: {
        ...data,
        ...(data.name ? { nameKey: data.name.toLowerCase() } : {}),
        updatedAt: new Date(),
      },
      $inc: { referenceVersion: 1 },
    },
    { returnDocument: "after" },
  );
  if (!row) {
    throw new HttpError(404, "NOT_FOUND", "Category not found.");
  }
  return categoryView(row);
}

export async function deleteCategory(actor: Actor, id: string) {
  requireRole(actor, "staff");
  const _id = idOf(id);
  await client().withSession((session) =>
    session.withTransaction(async () => {
      const result = await categories().updateOne(
        { _id },
        { $inc: { referenceVersion: 1 } },
        { session },
      );
      if (!result.matchedCount) {
        throw new HttpError(404, "NOT_FOUND", "Category not found.");
      }
      if (
        await requests().countDocuments(
          { categoryId: _id },
          { session, limit: 1 },
        )
      )
        throw conflict("This category has requests. Deactivate it instead.");
      await categories().deleteOne({ _id }, { session });
    }),
  );
}

export async function dashboard(actor: Actor): Promise<Dashboard> {
  const [result] = await requests()
    .aggregate<{
      counts: { _id: string; count: number }[];
      recent: RequestDoc[];
    }>([
      { $match: scope(actor) },
      {
        $facet: {
          counts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          recent: [{ $sort: { createdAt: -1, _id: -1 } }, { $limit: 5 }],
        },
      },
    ])
    .toArray();
  const count = (status: string) => result.counts.find((item) => item._id === status)?.count || 0;
  const open = count("open");
  const inProgress = count("in_progress");
  const resolved = count("resolved");
  return {
    counts: { total: open + inProgress + resolved, open, inProgress, resolved },
    recentRequests: await requestViews(result.recent, actor),
  };
}
