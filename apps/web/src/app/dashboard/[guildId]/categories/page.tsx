import { getCategories } from "@/app/actions/categories";
import CategoryList from "@/components/CategoryList";

export const dynamic = "force-dynamic";

export default async function CategoriesPage(props: {
  params: Promise<{ guildId: string }>;
}) {
  try {
    const params = await props.params;
    const categories = await getCategories(params.guildId);

    return (
      <>
        <CategoryList initialCategories={categories} guildId={params.guildId} />
      </>
    );
  } catch (error) {
    console.error("Error in CategoriesPage:", error);
    return <div>Erro ao carregar categorias.</div>;
  }
}
