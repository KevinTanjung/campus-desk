"use client";

import { SaveError } from "./ui";
import { useState } from "react";
import { categorySchema } from "@/lib/validation";
import { api, useResource } from "@/lib/browser";
import type { Category } from "@/lib/types";
import { Heading, LoadState, ConfirmDialog } from "./ui";

export default function Categories() {
  const state = useResource<{ data: Category[] }>("/api/categories");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const parsed = categorySchema.safeParse({
      name: String(new FormData(form).get("name")),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api(
        editing ? `/api/categories/${editing.id}` : "/api/categories",
        editing ? "PATCH" : "POST",
        parsed.data,
      );
      setEditing(null);
      form.reset();
      setSuccess("Category saved.");
      state.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function change(row: Category, remove = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api(
        `/api/categories/${row.id}`,
        remove ? "DELETE" : "PATCH",
        remove ? undefined : { active: !row.active },
      );
      setDeleting(null);
      setSuccess(remove ? "Category deleted." : "Category updated.");
      state.reload();
    } catch (e) {
      setDeleting(null);
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        title="Categories"
        description="Create the services students can request. Deactivate categories you no longer offer."
      />
      {error && <SaveError message={error} />}
      {success && (
        <p className="mb-6 rounded-lg bg-[#eaf4ef] px-5 py-4" role="status">
          {success}
        </p>
      )}
      <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
        <h2>{editing ? "Rename category" : "New category"}</h2>
        <form
          key={editing?.id || "new"}
          className="grid max-w-[740px] gap-[22px]"
          onSubmit={save}
        >
          <label>
            Category name
            <input
              name="name"
              defaultValue={editing?.name}
              required
              minLength={2}
              maxLength={60}
              placeholder="For example, Transcripts"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
              disabled={busy}
            >
              {busy ? "Saving..." : editing ? "Save name" : "Add category"}
            </button>
            {editing && (
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
        <h2>Campus services</h2>
        <LoadState {...state} retry={state.reload} />
        {state.data &&
          (state.data.data.length ? (
            <table className="w-full border-collapse text-left text-sm [&_th]:bg-[#f3f6f6] [&_th]:px-3.5 [&_th]:py-[11px] [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[var(--muted)] [&_td]:border-b [&_td]:border-[#edf1f1] [&_td]:px-3.5 [&_td]:py-4 [&_td]:align-middle [&_tr:last-child_td]:border-0 [&_a]:font-semibold [&_a]:text-[#243e45] [&_small]:mt-0.5 [&_small]:block [&_small]:text-xs [&_small]:text-[var(--muted)] max-[1100px]:[&_th]:px-2 max-[1100px]:[&_td]:px-2 max-[700px]:block max-[700px]:[&_thead]:hidden max-[700px]:[&_tbody]:block max-[700px]:[&_tr]:mb-3.5 max-[700px]:[&_tr]:block max-[700px]:[&_tr]:rounded-[10px] max-[700px]:[&_tr]:border max-[700px]:[&_tr]:border-[var(--line)] max-[700px]:[&_tr]:p-3.5 max-[700px]:[&_td]:block max-[700px]:[&_td]:border-0 max-[700px]:[&_td]:px-0 max-[700px]:[&_td]:py-[3px] max-[700px]:[&_td[data-label]]:before:mr-2 max-[700px]:[&_td[data-label]]:before:text-xs max-[700px]:[&_td[data-label]]:before:text-[var(--muted)] max-[700px]:[&_td[data-label]]:before:content-[attr(data-label)]">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Availability</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.data.data.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-3 py-[5px] text-xs font-bold ${row.active ? "bg-[#dff3ea] text-[#1b684c]" : "bg-[#fff3d6] text-[#765400]"}`}
                      >
                        {row.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                          disabled={busy}
                          aria-label={`Rename ${row.name}`}
                          onClick={() => {
                            setEditing(row);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
                          disabled={busy}
                          aria-label={`${row.active ? "Deactivate" : "Activate"} ${row.name}`}
                          onClick={() => change(row)}
                        >
                          {row.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dcaba5] bg-[#fff1ef] px-[18px] py-[11px] font-semibold text-[#922e21] no-underline"
                          disabled={busy}
                          aria-label={`Delete ${row.name}`}
                          onClick={() => setDeleting(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-11 text-center [&_h2]:mb-2.5">
              <h2>No categories yet</h2>
              <p>
                Add your first service above. Students can then submit requests
                for it.
              </p>
            </div>
          ))}
      </section>
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => change(deleting, true)}
        >
          Only categories without requests can be deleted. Deactivate a category
          to keep existing requests.
        </ConfirmDialog>
      )}
    </>
  );
}
