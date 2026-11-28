"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { statusLabels, type Status, type ServiceRequest } from "@/lib/types";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-[5px] text-xs font-bold ${status === "open" ? "bg-[#fff3d6] text-[#765400]" : status === "in_progress" ? "bg-[#e4efff] text-[#244e8c]" : "bg-[#dff3ea] text-[#1b684c]"}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <>
      <p className="mb-7 text-[11px] font-bold uppercase tracking-[1.2px] text-[var(--muted)] max-[700px]:mb-[18px]">
        Workspace /{" "}
        {title === "Campus services, simplified." ? "Overview" : title}
      </p>
      <header className="mb-8 flex items-center justify-between gap-6 [&_h1]:mb-2.5 [&_p]:m-0 [&_p]:text-[var(--muted)] max-[700px]:mb-6 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:gap-5">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </header>
    </>
  );
}

export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: Error;
  retry: () => void;
}) {
  if (loading) return <p role="status">Loading...</p>;
  if (error)
    return (
      <div
        className="mb-5 rounded-lg bg-[#fff1ef] px-[18px] py-3.5 text-[#862b20] [overflow-wrap:anywhere]"
        role="alert"
      >
        <p>{error.message}</p>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
          onClick={retry}
        >
          Try again
        </button>
      </div>
    );
  return null;
}

export function RequestTable({
  rows,
  staff,
}: {
  rows: ServiceRequest[];
  staff: boolean;
}) {
  return (
    <table className="w-full border-collapse text-left text-sm [&_th]:bg-[#f3f6f6] [&_th]:px-3.5 [&_th]:py-[11px] [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[var(--muted)] [&_td]:border-b [&_td]:border-[#edf1f1] [&_td]:px-3.5 [&_td]:py-4 [&_td]:align-middle [&_tr:last-child_td]:border-0 [&_a]:font-semibold [&_a]:text-[#243e45] [&_small]:mt-0.5 [&_small]:block [&_small]:text-xs [&_small]:text-[var(--muted)] max-[1100px]:[&_th]:px-2 max-[1100px]:[&_td]:px-2 max-[700px]:block max-[700px]:[&_thead]:hidden max-[700px]:[&_tbody]:block max-[700px]:[&_tr]:mb-3.5 max-[700px]:[&_tr]:block max-[700px]:[&_tr]:rounded-[10px] max-[700px]:[&_tr]:border max-[700px]:[&_tr]:border-[var(--line)] max-[700px]:[&_tr]:p-3.5 max-[700px]:[&_td]:block max-[700px]:[&_td]:border-0 max-[700px]:[&_td]:px-0 max-[700px]:[&_td]:py-[3px] max-[700px]:[&_td[data-label]]:before:mr-2 max-[700px]:[&_td[data-label]]:before:text-xs max-[700px]:[&_td[data-label]]:before:text-[var(--muted)] max-[700px]:[&_td[data-label]]:before:content-[attr(data-label)]">
      <thead>
        <tr>
          <th scope="col">Request</th>
          <th scope="col">Category</th>
          {staff && <th scope="col">Student</th>}
          <th scope="col">Status</th>
          <th scope="col">Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <Link href={`/requests/${row.id}`}>{row.title}</Link>
              {row.location && <small>{row.location}</small>}
            </td>
            <td data-label="Category">{row.category.name}</td>
            {staff && <td data-label="Student">{row.reporter?.name}</td>}
            <td>
              <StatusBadge status={row.status} />
            </td>
            <td data-label="Created">
              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FieldError({
  name,
  fields,
}: {
  name: string;
  fields: Record<string, string>;
}) {
  return fields[name] ? (
    <span
      id={`${name}-error`}
      className="mt-1.5 block text-[13px] font-normal text-[#962b20]"
    >
      {fields[name]}
    </span>
  ) : null;
}

export function ConfirmDialog({
  title,
  children,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: React.ReactNode;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="m-auto w-[calc(100%-36px)] max-w-[480px] rounded-[14px] border border-[var(--line)] p-7 text-[#172c35] backdrop:bg-[#102e2b88]"
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p>{children}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
          disabled={busy}
          onClick={onCancel}
          autoFocus
        >
          Cancel
        </button>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dcaba5] bg-[#fff1ef] px-[18px] py-[11px] font-semibold text-[#922e21] no-underline"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Deleting..." : "Delete"}
        </button>
      </div>
    </dialog>
  );
}

export function SaveError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-lg bg-[#fff1ef] px-[18px] py-3.5 text-[#862b20] [overflow-wrap:anywhere]"
    >
      {message}
      {message.startsWith("Your session has expired.") && (
        <p className="mt-2 mb-0">
          <a href="/login" target="_blank" rel="noopener noreferrer">
            Log in in a new tab
          </a>
        </p>
      )}
    </div>
  );
}
