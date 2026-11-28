import RequestForm from "@/components/request-form";
import { Heading } from "@/components/ui";
import { pageActor } from "@/lib/page-auth";

export default async function NewRequest() {
  await pageActor("student");
  return (
    <>
      <Heading
        title="New request"
        description="Tell us which campus service you need."
      />
      <section className="mb-6 min-w-0 rounded-[13px] bg-white p-[26px] max-[700px]:p-5">
        <RequestForm />
      </section>
    </>
  );
}
