import { endpoint, json, readJson } from "@/lib/http";
import { editCategory, deleteCategory } from "@/lib/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = endpoint(async (request, actor, id) =>
  json({ data: await editCategory(actor, id!, await readJson(request)) }),
);
export const DELETE = endpoint(async (_, actor, id) => {
  await deleteCategory(actor, id!);
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "private, no-store" },
  });
});
