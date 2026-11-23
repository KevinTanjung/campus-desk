import { getAuth } from "@/lib/auth";
import {
  checkOrigin,
  errorResponse,
  HttpError,
  json,
  readJson,
} from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const paths = new Set([
  "sign-up/email",
  "sign-in/email",
  "sign-out",
  "get-session",
]);
async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace("/api/auth/", "");
    if (
      !paths.has(path) ||
      (request.method === "GET") !== (path === "get-session")
    )
      throw new HttpError(404, "NOT_FOUND", "Endpoint not found.");
    if (request.method === "POST") {
      checkOrigin(request);
      const body = await readJson(request);
      if (
        path === "sign-out" &&
        (!body ||
          Array.isArray(body) ||
          typeof body !== "object" ||
          Object.keys(body).length)
      )
        return json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Send an empty object.",
            },
          },
          400,
        );
      const headers = new Headers(request.headers);
      headers.delete("content-length");
      request = new Request(request.url, {
        method: request.method,
        headers,
        body: JSON.stringify(body),
      });
    }
    const response = await (await getAuth()).handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = handle;
export const POST = handle;
