import Categories from "@/components/categories";
import { pageActor } from "@/lib/page-auth";
export default async function CategoriesPage() {
  await pageActor("staff");
  return <Categories />;
}
