import Shell from "@/components/shell";
import { pageActor } from "@/lib/page-auth";
export const dynamic = "force-dynamic";
export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await pageActor();
  return <Shell actor={actor}>{children}</Shell>;
}
