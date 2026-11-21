import { endpoint, json, readJson } from "@/lib/http";
import { listRequests, createRequest } from "@/lib/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (request, actor) =>
  json(
    await listRequests(
      actor,
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  ),
);
export const POST = endpoint(async (request, actor) =>
  json({ data: await createRequest(actor, await readJson(request)) }, 201),
);
