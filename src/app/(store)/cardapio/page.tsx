import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/store/section";
import { MenuBrowser } from "@/components/store/menu-browser";
import { listCategories, listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";

export const metadata: Metadata = pageMetadata({
  title: "Cardápio de marmitas",
  description: "Marmitas tradicionais, low carb, fitness, executivas, vegetarianas, veganas e combos da Marmifit Camburi. Filtre por categoria e restrição alimentar.",
  path: "/cardapio",
});

export default async function MenuPage({ searchParams }: PageProps<"/cardapio">) {
  const sp = await searchParams;
  const [categories, products, ctx] = await Promise.all([listCategories(), listProducts(), getListingContext()]);
  const initialCategory = typeof sp.categoria === "string" ? sp.categoria : "todas";

  return (
    <>
      <PageHeader
        eyebrow="Cardápio"
        title="Escolha sua próxima refeição"
        description="Tudo preparado no dia. Filtre por categoria, estilo de alimentação ou alergênicos."
      />
      <MenuBrowser
        categories={categories.filter((c) => c.slug !== "personalizadas").map((c) => ({ slug: c.slug, name: c.name }))}
        products={products}
        defaultSize={ctx.defaultSize}
        initialCategory={initialCategory}
      />
    </>
  );
}
