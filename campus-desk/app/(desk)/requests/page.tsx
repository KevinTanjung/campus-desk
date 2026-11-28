"use client";
import Link from "next/link";
import { useState } from "react";
import { useActor } from "@/components/shell";
import { Heading, LoadState, RequestTable } from "@/components/ui";
import { useResource } from "@/lib/browser";
import type { Category, RequestPage } from "@/lib/types";

export default function RequestsPage() {
  const actor = useActor();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const state = useResource<RequestPage>(
    `/api/requests?${filter}${filter ? "&" : ""}page=${page}`,
  );
  const categories = useResource<{ data: Category[] }>("/api/categories");

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget),
      params = new URLSearchParams();
    values.forEach((value, key) => {
      if (value) params.set(key, String(value));
    });
    setPage(1);
    setFilter(params.toString());
  }

  const data = state.data;

  return (
    <>
      <Heading
        title={actor.role === "staff" ? "All requests" : "My requests"}
        description="Find a request and follow its progress."
        action={
          actor.role === "student" ? (
            <Link
              href="/requests/new"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
            >
              + New request
            </Link>
          ) : undefined
        }
      />
      <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
        <form
          className="mb-6 grid grid-cols-[2fr_1fr_1.2fr_1.3fr_auto] items-end gap-3.5 [&_label]:text-xs max-[1100px]:grid-cols-2 max-[1100px]:[&_label:first-child]:col-span-2 max-[700px]:grid-cols-1 max-[700px]:[&_label:first-child]:col-span-1"
          onSubmit={apply}
        >
          <label>
            Search titles
            <input
              type="search"
              name="q"
              maxLength={100}
              placeholder="Search requests"
            />
          </label>
          <label>
            Status
            <select name="status">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label>
            Category
            <select name="categoryId">
              <option value="">All categories</option>
              {categories.data?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                  {cat.active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select name="sort">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title_asc">Title A to Z</option>
              <option value="title_desc">Title Z to A</option>
            </select>
          </label>
          <button className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline">
            Apply
          </button>
        </form>
        {categories.error && (
          <LoadState {...categories} retry={categories.reload} />
        )}
        <LoadState {...state} retry={state.reload} />
        {data && (
          <>
            {data.data.length ? (
              <RequestTable rows={data.data} staff={actor.role === "staff"} />
            ) : (
              <div className="px-5 py-11 text-center [&_h2]:mb-2.5">
                <h2>No matching requests</h2>
                <p className="text-[var(--muted)]">
                  Try different filters
                  {actor.role === "student"
                    ? " or create your first request"
                    : ""}
                  .
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3.5">
              <span className="text-[var(--muted)]">
                {data.total} request{data.total === 1 ? "" : "s"} · Page {page}{" "}
                of {Math.max(1, Math.ceil(data.total / data.pageSize))}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <button
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
