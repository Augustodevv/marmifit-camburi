import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AdminTitle } from "@/components/admin/page-title";
import { ProductForm } from "@/components/admin/product-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: PageProps<"/admin/produtos/[id]">) {
  await requireOwner();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    id === "novo" ? null : db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (id !== "novo" && !product) notFound();
  return (
    <>
      <Link href="/admin/produtos" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-forest"><ChevronLeft className="size-4" /> Produtos</Link>
      <AdminTitle title={product ? product.name : "Novo produto"}>
        {product && <Link href={`/cardapio/${product.slug}`} target="_blank" className="text-sm font-semibold text-leaf">Ver na loja</Link>}
      </AdminTitle>
      <ProductForm product={product} categories={categories} />
    </>
  );
}
