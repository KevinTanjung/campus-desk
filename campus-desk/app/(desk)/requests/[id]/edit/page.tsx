import EditRequest from "@/components/edit-request";
import { pageActor } from "@/lib/page-auth";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await pageActor("student");
  return <EditRequest id={(await params).id} />;
}
