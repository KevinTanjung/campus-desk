import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentActor } from "./http";
import type { Role } from "./types";
export async function pageActor(role?: Role) {
  const actor = await currentActor(await headers());
  if (!actor) redirect("/login");
  if (role && actor.role !== role) redirect("/dashboard");
  return actor;
}
