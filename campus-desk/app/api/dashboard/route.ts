import { endpoint, json } from "@/lib/http";
import { dashboard } from "@/lib/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (_, actor) =>
  json({ data: await dashboard(actor) }),
);
