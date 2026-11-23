"use client";
import Link from "next/link";
import { useResource } from "@/lib/browser";
import type { ServiceRequest } from "@/lib/types";
import RequestForm from "./request-form";
import { Heading, LoadState } from "./ui";
export default function EditRequest({ id }: { id: string }) {
  const state = useResource<{ data: ServiceRequest }>(`/api/requests/${id}`),
    row = state.data?.data;
  return (
    <>
      <Heading
        title="Edit request"
        description="You can change your request while it is open."
      />
      <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
        <LoadState {...state} retry={state.reload} />
        {row &&
          (row.status === "open" ? (
            <RequestForm existing={row} />
          ) : (
            <>
              <p className="mb-6 rounded-lg bg-[#eaf4ef] px-5 py-4">
                This request is no longer open and cannot be edited.
              </p>
              <Link href={`/requests/${id}`}>Back to request</Link>
            </>
          ))}
      </section>
    </>
  );
}
