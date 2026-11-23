"use client";
import { SaveError } from "./ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, useResource } from "@/lib/browser";
import type { ServiceRequest } from "@/lib/types";
import { useActor } from "./shell";
import {
  Heading,
  LoadState,
  StatusBadge,
  ConfirmDialog,
  FieldError,
} from "./ui";
export default function RequestDetail({ id }: { id: string }) {
  const actor = useActor(),
    router = useRouter(),
    state = useResource<{ data: ServiceRequest }>(`/api/requests/${id}`),
    row = state.data?.data;
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fields, setFields] = useState<Record<string, string>>({});
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/requests/${id}`, "DELETE");
      router.push("/requests");
      router.refresh();
    } catch (e) {
      setConfirm(false);
      setBusy(false);
      setError(
        e instanceof Error ? e.message : "Could not delete. Please try again.",
      );
    }
  }
  async function progress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !row) return;
    setBusy(true);
    setFields({});
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      await api(`/api/requests/${id}/status`, "PATCH", {
        status: row.status === "open" ? "in_progress" : "resolved",
        resolutionNote: values.get("resolutionNote") || "",
      });
      state.reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update. Please try again.",
      );
      if (e instanceof ApiError) setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="Request details"
        description="The latest information about this campus service request."
        action={
          <Link
            href="/requests"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
          >
            Back to requests
          </Link>
        }
      />
      <LoadState {...state} retry={state.reload} />
      {error && <SaveError message={error} />}
      {row && (
        <>
          <div className="grid grid-cols-[2fr_1fr] gap-6 max-[1100px]:grid-cols-1">
            <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
              <div className="mb-[18px] flex items-center justify-between gap-4 [&_h2]:m-0 max-[700px]:items-start max-[700px]:[&_h2]:text-xl">
                <h2>{row.title}</h2>
                <StatusBadge status={row.status} />
              </div>
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {row.description}
              </p>
              {row.resolutionNote && (
                <>
                  <h3>Staff note</h3>
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {row.resolutionNote}
                  </p>
                </>
              )}
              {actor.role === "student" && row.status === "open" && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                    href={`/requests/${id}/edit`}
                  >
                    Edit request
                  </Link>
                  <button
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dcaba5] bg-[#fff1ef] px-[18px] py-[11px] font-semibold text-[#922e21] no-underline"
                    disabled={busy}
                    onClick={() => setConfirm(true)}
                  >
                    Delete request
                  </button>
                </div>
              )}
              {actor.role === "student" && row.status !== "open" && (
                <p className="mb-6 rounded-lg bg-[#eaf4ef] px-5 py-4">
                  Staff have started this request. It can no longer be edited or
                  deleted.
                </p>
              )}
            </section>
            <aside className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
              <h2>Request information</h2>
              <dl className="grid gap-[18px] [&_dt]:text-xs [&_dt]:uppercase [&_dt]:tracking-wide [&_dt]:text-[var(--muted)] [&_dd]:mt-[3px] [&_dd]:ml-0 [&_dd]:[overflow-wrap:anywhere]">
                <div>
                  <dt>Category</dt>
                  <dd>{row.category.name}</dd>
                </div>
                <div>
                  <dt>Student</dt>
                  <dd>{row.reporter?.name}</dd>
                </div>
                <div>
                  <dt>Location or collection</dt>
                  <dd>{row.location || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{new Date(row.createdAt).toLocaleString("en-GB")}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(row.updatedAt).toLocaleString("en-GB")}</dd>
                </div>
                {row.resolvedAt && (
                  <div>
                    <dt>Resolved</dt>
                    <dd>{new Date(row.resolvedAt).toLocaleString("en-GB")}</dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
          {actor.role === "staff" && row.status !== "resolved" && (
            <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
              <h2>
                {row.status === "open"
                  ? "Start working on this request"
                  : "Resolve this request"}
              </h2>
              <form
                className="grid max-w-[740px] gap-[22px]"
                onSubmit={progress}
              >
                <label>
                  Staff note{" "}
                  {row.status === "open" && (
                    <span className="text-[var(--muted)]">(optional)</span>
                  )}
                  <textarea
                    name="resolutionNote"
                    defaultValue={row.resolutionNote}
                    maxLength={1000}
                    minLength={row.status === "in_progress" ? 5 : undefined}
                    required={row.status === "in_progress"}
                    aria-invalid={!!fields.resolutionNote}
                    aria-describedby={
                      fields.resolutionNote ? "resolutionNote-error" : undefined
                    }
                  />
                  <FieldError name="resolutionNote" fields={fields} />
                </label>
                <button
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
                  disabled={busy}
                >
                  {busy
                    ? "Saving..."
                    : row.status === "open"
                      ? "Mark in progress"
                      : "Mark resolved"}
                </button>
              </form>
            </section>
          )}
        </>
      )}
      {confirm && (
        <ConfirmDialog
          title="Delete this request?"
          busy={busy}
          onCancel={() => setConfirm(false)}
          onConfirm={remove}
        >
          This removes the request. You cannot undo this action.
        </ConfirmDialog>
      )}
    </>
  );
}
