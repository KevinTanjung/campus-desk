"use client";
import Link from "next/link";
import { useActor } from "@/components/shell";
import { Heading, LoadState, RequestTable } from "@/components/ui";
import { useResource } from "@/lib/browser";
import type { Dashboard } from "@/lib/types";
export default function DashboardPage() {
  const actor = useActor(),
    state = useResource<{ data: Dashboard }>("/api/dashboard");
  const data = state.data?.data;
  return (
    <>
      <Heading
        title="Campus services, simplified."
        description={
          actor.role === "staff"
            ? "Review campus requests and help students move forward."
            : "Request a campus service and follow its progress."
        }
        action={
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
            href={actor.role === "staff" ? "/requests" : "/requests/new"}
          >
            {actor.role === "staff" ? "Review requests" : "+ New request"}
          </Link>
        }
      />
      <LoadState {...state} retry={state.reload} />
      {data && (
        <>
          <section
            className="mb-[30px] grid grid-cols-4 gap-5 max-[700px]:grid-cols-2 max-[700px]:gap-3"
            aria-label="Request counts"
          >
            {[
              ["Total requests", data.counts.total],
              ["Open", data.counts.open],
              ["In progress", data.counts.inProgress],
              ["Resolved", data.counts.resolved],
            ].map(([label, count]) => (
              <div
                className="rounded-[13px] bg-white px-6 py-[22px] [&_span]:mb-2 [&_span]:block [&_span]:text-sm [&_span]:text-[var(--muted)] [&_strong]:text-4xl [&_strong]:text-[#173e3b] max-[1100px]:p-[18px] max-[700px]:p-4 max-[700px]:[&_strong]:text-[30px] max-[700px]:[&_span]:text-[13px]"
                key={label}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </section>
          <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
            <div className="mb-[18px] flex items-center justify-between gap-4 [&_h2]:m-0 max-[700px]:items-start max-[700px]:[&_h2]:text-xl">
              <h2>Recent requests</h2>
              <Link href="/requests">View all →</Link>
            </div>
            <p className="text-[var(--muted)]">
              The five most recent requests you can access.
            </p>
            {data.recentRequests.length ? (
              <RequestTable
                rows={data.recentRequests}
                staff={actor.role === "staff"}
              />
            ) : (
              <div className="px-5 py-11 text-center [&_h2]:mb-2.5">
                <h2>No requests yet</h2>
                <p className="text-[var(--muted)]">
                  {actor.role === "staff"
                    ? "Student requests will appear here."
                    : "Start by requesting a campus service."}
                </p>
                {actor.role === "student" && (
                  <Link
                    href="/requests/new"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
                  >
                    New request
                  </Link>
                )}
              </div>
            )}
          </section>
          <div className="mt-[34px] text-[var(--muted)]">
            <strong>
              {actor.role === "staff"
                ? "Keep students informed."
                : "Need to correct a request?"}
            </strong>
            <p>
              {actor.role === "staff"
                ? "Update the status as work progresses, and leave a clear note when it is resolved."
                : "You can edit or delete your requests while their status is Open."}
            </p>
          </div>
        </>
      )}
    </>
  );
}
