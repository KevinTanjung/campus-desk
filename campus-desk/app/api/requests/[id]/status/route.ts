import { endpoint, json, readJson } from "@/lib/http";
import { updateStatus } from "@/lib/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = endpoint(async (request, actor, id) =>
  json({ data: await updateStatus(actor, id!, await readJson(request)) }),
);
