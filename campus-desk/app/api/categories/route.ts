import { endpoint, json, readJson } from "@/lib/http";
import { listCategories, createCategory } from "@/lib/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (_, actor) =>
  json({ data: await listCategories(actor) }),
);
export const POST = endpoint(async (request, actor) =>
  json({ data: await createCategory(actor, await readJson(request)) }, 201),
);
