"use client";

import { SaveError } from "./ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError, useResource } from "@/lib/browser";
import type { Category, ServiceRequest } from "@/lib/types";
import { requestSchema } from "@/lib/validation";
import { FieldError, LoadState } from "./ui";

export default function RequestForm({
  existing,
}: {
  existing?: ServiceRequest;
}) {
  const router = useRouter();
  const categories = useResource<{ data: Category[] }>("/api/categories");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }

    setFields({});
    setError("");

    const parsed = requestSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (!parsed.success) {
      setFields(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      return;
    }

    setBusy(true);

    try {
      const result = await api<{ data: ServiceRequest }>(
        existing ? `/api/requests/${existing.id}` : "/api/requests",
        existing ? "PATCH" : "POST",
        parsed.data,
      );
      router.push(`/requests/${result.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
      if (e instanceof ApiError) {
        setFields(e.fields);
      }
      setBusy(false);
    }
  }
  const options = categories.data?.data || [],
    inactive =
      existing && !options.some((cat) => cat.id === existing.category.id);
  const noCategories = !existing && categories.data && !options.length;
  return (
    <>
      <LoadState {...categories} retry={categories.reload} />
      {categories.data && (
        <>
          {noCategories && (
            <p className="mb-6 rounded-lg bg-[#eaf4ef] px-5 py-4">
              No service categories are available yet. Please ask campus staff
              to create one.
            </p>
          )}
          {error && <SaveError message={error} />}
          <form
            className="grid max-w-[740px] gap-[22px]"
            onSubmit={submit}
            noValidate
          >
            <label>
              Title
              <input
                name="title"
                defaultValue={existing?.title}
                minLength={5}
                maxLength={120}
                required
                aria-invalid={!!fields.title}
                aria-describedby={fields.title ? "title-error" : undefined}
                placeholder="For example, official transcript request"
              />
              <FieldError name="title" fields={fields} />
            </label>
            <label>
              Category
              <select
                name="categoryId"
                defaultValue={existing?.category.id || ""}
                required
                aria-invalid={!!fields.categoryId}
                aria-describedby={
                  fields.categoryId ? "categoryId-error" : undefined
                }
              >
                <option value="" disabled>
                  Choose a service
                </option>
                {inactive && (
                  <option value={existing.category.id}>
                    {existing.category.name} (inactive)
                  </option>
                )}
                {options.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <FieldError name="categoryId" fields={fields} />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={existing?.description}
                minLength={20}
                maxLength={2000}
                required
                aria-invalid={!!fields.description}
                aria-describedby={
                  fields.description ? "description-error" : undefined
                }
                placeholder="Describe what you need so staff can help."
              />
              <FieldError name="description" fields={fields} />
            </label>
            <label>
              Location or collection point{" "}
              <span className="text-[var(--muted)]">(optional)</span>
              <input
                name="location"
                defaultValue={existing?.location}
                maxLength={120}
                aria-invalid={!!fields.location}
                aria-describedby={
                  fields.location ? "location-error" : undefined
                }
                placeholder="For example, Student Services counter"
              />
              <FieldError name="location" fields={fields} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-[#1d6257] px-[18px] py-[11px] font-semibold text-white no-underline"
                disabled={busy || !!noCategories}
              >
                {busy
                  ? "Saving..."
                  : existing
                    ? "Save changes"
                    : "Submit request"}
              </button>
              <Link
                href={existing ? `/requests/${existing.id}` : "/requests"}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#a7b8b8] bg-white px-[18px] py-[11px] font-semibold text-[#172c35] no-underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}
    </>
  );
}
