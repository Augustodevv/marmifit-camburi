import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/page-title";
import { ActionButton } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { WEEKDAYS } from "@/lib/hours";
import { deleteProduct, toggleProductFlag } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Produtos" };

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/produtos">) {
  await requireOwner();
  const sp = await searchParams;
  const cat = typeof sp.c === "string" ? sp.c : "";
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: cat ? { categoryId: cat } : {}, include: { category: true }, orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <AdminTitle title="Produtos" description={`${products.length} produtos`}>
        <Link href="/admin/produtos/novo" className="inline-flex items-center gap-2 rounded-xl bg-tangerine px-4 py-2.5 text-sm font-semibold text-forest">
          <Plus className="size-4" aria-hidden /> Novo produto
        </Link>
      </AdminTitle>
      <nav className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        <Link href="/admin/produtos" className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", !cat ? "bg-forest text-cream" : "bg-white")}>Todas</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/admin/produtos?c=${c.id}`} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", cat === c.id ? "bg-forest text-cream" : "bg-white")}>{c.name}</Link>
        ))}
      </nav>
      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Dias</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={cn("border-t border-cream-300/70", !p.active && "opacity-50")}>
                <td className="p-3">
                  <Link href={`/admin/produtos/${p.id}`} className="font-semibold text-forest hover:underline">{p.name}</Link>
                  {!p.image && <span className="ml-2 rounded bg-cream-200 px-1.5 text-[10px] text-muted-foreground">sem foto</span>}
                </td>
                <td className="p-3 text-muted-foreground">{p.category.name}</td>
                <td className="p-3 tabular-nums">
                  {formatBRL(p.basePrice)}
                  {p.compareAtPrice && <s className="ml-1 text-xs text-muted-foreground">{formatBRL(p.compareAtPrice)}</s>}
                </td>
                <td className="p-3 text-xs">{p.dailyDays.length ? p.dailyDays.map((d) => WEEKDAYS[d].slice(0, 3)).join(", ") : "Todos"}</td>
                <td className="p-3">
                  <ActionButton run={toggleProductFlag.bind(null, p.id, "available")} className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.available ? "bg-leaf-100 text-leaf" : "bg-destructive/10 text-destructive")} label="Alternar disponibilidade">
                    {p.available ? "Disponível" : "Esgotado"}
                  </ActionButton>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <ActionButton run={toggleProductFlag.bind(null, p.id, "featured")} className="rounded-lg p-2 hover:bg-cream" label={p.featured ? "Remover destaque" : "Destacar"}>
                      <Star className={cn("size-4", p.featured && "fill-tangerine text-tangerine")} />
                    </ActionButton>
                    <ActionButton run={toggleProductFlag.bind(null, p.id, "active")} className="rounded-lg p-2 hover:bg-cream" label={p.active ? "Ocultar do cardápio" : "Mostrar no cardápio"}>
                      {p.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </ActionButton>
                    <Link href={`/admin/produtos/${p.id}`} className="rounded-lg p-2 hover:bg-cream" aria-label="Editar"><Pencil className="size-4" /></Link>
                    <ActionButton run={deleteProduct.bind(null, p.id)} confirm={`Excluir "${p.name}"? Se houver pedidos com ele, será apenas desativado.`} success="Produto removido" className="rounded-lg p-2 text-destructive hover:bg-destructive/10" label="Excluir">
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
