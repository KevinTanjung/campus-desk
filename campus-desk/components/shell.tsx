"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import type { Actor } from "@/lib/types";
import { authClient } from "@/lib/browser";

const ActorContext = createContext<Actor | null>(null);

export function useActor() {
  const actor = useContext(ActorContext);
  if (!actor) {
    throw new Error("Missing account.");
  }
  return actor;
}

export default function Shell({
  actor,
  children,
}: {
  actor: Actor;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        throw new Error("Logout failed. Please try again.");
      }
      window.location.assign("/login");
    } catch {
      setError("Logout failed. Please try again.");
      setBusy(false);
    }
  }
  return (
    <ActorContext.Provider value={actor}>
      <div className="min-h-dvh">
        <a
          className="fixed -top-[100px] left-[250px] z-20 bg-white p-3 focus:top-2.5 max-[700px]:left-5"
          href="#main"
        >
          Skip to content
        </a>
        <aside
          className={`group fixed inset-y-0 left-0 z-10 flex w-[236px] flex-col bg-[#173e3b] px-[18px] pt-[34px] pb-6 text-white max-[1100px]:w-[205px] max-[700px]:sticky max-[700px]:inset-auto max-[700px]:top-0 max-[700px]:grid max-[700px]:w-auto max-[700px]:grid-cols-[1fr_auto] max-[700px]:items-center max-[700px]:px-5 max-[700px]:py-[18px] ${expanded ? "is-open" : ""}`}
        >
          <Link
            href="/dashboard"
            className="px-2.5 text-[22px] font-bold tracking-wide text-white no-underline max-[700px]:px-0 max-[700px]:text-[19px]"
          >
            CAMPUS DESK
          </Link>
          <button
            className="hidden max-[700px]:block rounded-md border border-[#64847c] bg-transparent px-3 py-1 text-white"
            aria-expanded={expanded}
            aria-controls="navigation"
            onClick={() => setExpanded(!expanded)}
          >
            Menu
          </button>
          <p className="mb-11 mt-1 px-2.5 text-[13px] text-[#c5d9d1] max-[700px]:hidden">
            Campus services
          </p>
          <nav
            id="navigation"
            className="grid gap-2.5 [&_a]:rounded-lg [&_a]:px-[18px] [&_a]:py-3 [&_a]:text-[#e0ece7] [&_a]:no-underline [&_a[aria-current=page]]:bg-[#315653] [&_a[aria-current=page]]:font-bold [&_a[aria-current=page]]:text-white max-[700px]:hidden max-[700px]:group-[.is-open]:grid max-[700px]:col-span-full max-[700px]:mt-4"
            aria-label="Main navigation"
          >
            {[
              ["/dashboard", "Overview"],
              [
                "/requests",
                actor.role === "staff" ? "All requests" : "My requests",
              ],
              ...(actor.role === "staff"
                ? [["/categories", "Categories"]]
                : []),
            ].map(([url, label]) => (
              <Link
                key={url}
                href={url}
                aria-current={path.startsWith(url) ? "page" : undefined}
                onClick={() => setExpanded(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-2.5 pt-6 [&_p]:mb-1 [&_small]:capitalize [&_small]:text-[#c5d9d1] max-[700px]:hidden max-[700px]:group-[.is-open]:grid max-[700px]:col-span-full max-[700px]:mt-4 max-[700px]:px-0 max-[700px]:pt-3">
            <small>{actor.role} account</small>
            <p>
              <strong>{actor.name}</strong>
            </p>
            <button
              className="border-0 bg-transparent p-0 text-left text-[#e0ece7] underline"
              disabled={busy}
              onClick={logout}
            >
              {busy ? "Logging out..." : "Log out"}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </aside>
        <main
          id="main"
          className="ml-[236px] max-w-[1560px] px-11 pt-9 pb-[60px] max-[1100px]:ml-[205px] max-[1100px]:p-6 max-[700px]:m-0 max-[700px]:px-5 max-[700px]:pt-[26px] max-[700px]:pb-10"
        >
          {children}
        </main>
      </div>
    </ActorContext.Provider>
  );
}
