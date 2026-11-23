import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { getAuth } from "./auth";
import { database } from "./db";
import type { Actor, Role } from "./types";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join("."), issue.message]),
    );
    return json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the highlighted fields.",
          fields,
        },
      },
      400,
    );
  }
  if (error instanceof MongoError && "code" in error && error.code === 11000)
    return json(
      {
        error: {
          code: "CONFLICT",
          message: "A category with this name already exists.",
        },
      },
      409,
    );
  const unavailable =
    error instanceof MongoError ||
    (error instanceof Error &&
      /MONGODB_URI|BETTER_AUTH|AUTH_IP_HEADER/.test(error.message));
  console.error(
    "Campus Desk request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error: {
        code: unavailable ? "UNAVAILABLE" : "SERVER_ERROR",
        message: unavailable
          ? "The service is unavailable. Please try again."
          : "Something went wrong. Please try again.",
      },
    },
    unavailable ? 503 : 500,
  );
}
export function checkOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL || "http://127.0.0.1:3000").origin
  )
    throw new HttpError(
      403,
      "FORBIDDEN",
      "This request did not come from Campus Desk.",
    );
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(400, "INVALID_JSON", "Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "INVALID_JSON", "Send a JSON request.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 16 * 1024) {
      await reader.cancel();
      throw new HttpError(413, "TOO_LARGE", "The request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Send valid JSON.");
  }
}
export async function currentActor(headers: Headers): Promise<Actor | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const user = await database()
    .collection("user")
    .findOne(
      { $expr: { $eq: [{ $toString: "$_id" }, session.user.id] } },
      { projection: { name: 1, role: 1 } },
    );
  if (!user || (user.role !== "staff" && user.role !== "student")) return null;
  return { id: session.user.id, name: user.name, role: user.role };
}
export function requireRole(actor: Actor, role: Role) {
  if (actor.role !== role)
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Your account cannot perform this action.",
    );
}
export function endpoint(
  handler: (request: Request, actor: Actor, id?: string) => Promise<Response>,
) {
  return async (
    request: Request,
    context?: { params: Promise<{ id?: string }> },
  ) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) checkOrigin(request);
      const actor = await currentActor(request.headers);
      if (!actor)
        throw new HttpError(
          401,
          "UNAUTHENTICATED",
          "Please log in to continue.",
        );
      return await handler(
        request,
        actor,
        context?.params ? (await context.params).id : undefined,
      );
    } catch (error) {
      return errorResponse(error);
    }
  };
}
