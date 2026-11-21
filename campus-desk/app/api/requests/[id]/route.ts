import { endpoint, json, readJson } from "@/lib/http";
import { getRequest, editRequest, deleteRequest } from "@/lib/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (_, actor, id) =>
  json({ data: await getRequest(actor, id!) }),
);
export const PATCH = endpoint(async (request, actor, id) =>
  json({ data: await editRequest(actor, id!, await readJson(request)) }),
);
export const DELETE = endpoint(async (_, actor, id) => {
  await deleteRequest(actor, id!);
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
});
