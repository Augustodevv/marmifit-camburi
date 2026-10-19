import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminTitle } from "@/components/admin/page-title";
import { ActionButton } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { toggleIngredient } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Ingredientes" };

const GROUP_LABEL = { PROTEIN: "Proteína", BASE: "Base", SIDE: "Acompanhamento", ADDON: "Adicional" } as const;

export default async function IngredientsAdmin() {
  await requireOwner();
  const ingredients = await db.ingredient.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      <AdminTitle title="Ingredientes" description="Itens do configurador: preços, porções extras, restrições, alergênicos e nutrição.">
        <Link href="/admin/ingredientes/novo" className="inline-flex items-center gap-2 rounded-xl bg-tangerine px-4 py-2.5 text-sm font-semibold text-forest">
          <Plus className="size-4" aria-hidden /> Novo ingrediente
        </Link>
      </AdminTitle>
      <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-soft">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-cream-200/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Ingrediente</th><th className="p-3">Grupo</th><th className="p-3">Acréscimo</th><th className="p-3">Porção extra</th><th className="p-3">Perfil</th><th className="p-3">Nutrição</th><th className="p-3">Status</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {ingredients.map((i) => (
              <tr key={i.id} className="border-t border-cream-300/70">
                <td className="p-3 font-semibold"><Link href={`/admin/ingredientes/${i.id}`} className="hover:underline">{i.name}</Link></td>
                <td className="p-3 text-muted-foreground">{GROUP_LABEL[i.group]}</td>
                <td className="p-3 tabular-nums">{i.price ? formatBRL(i.price) : "—"}</td>
                <td className="p-3 tabular-nums">{i.extraPrice != null ? `${formatBRL(i.extraPrice)}${i.extraGrams ? ` / ${i.extraGrams} g` : ""}` : "—"}</td>
                <td className="p-3 text-xs">{[i.isVegan ? "vegano" : i.isVegetarian ? "vegetariano" : null, i.isLowCarb ? "low carb" : null].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-3 text-xs">{i.kcalPer100g != null ? `${i.kcalPer100g} kcal/100 g` : <span className="text-muted-foreground">não cadastrada</span>}</td>
                <td className="p-3">
                  <ActionButton run={toggleIngredient.bind(null, i.id)} className={cn("rounded-full px-2.5 py-1 text-xs font-bold", i.available ? "bg-leaf-100 text-leaf" : "bg-destructive/10 text-destructive")}>
                    {i.available ? "Disponível" : "Esgotado"}
                  </ActionButton>
                </td>
                <td className="p-3"><Link href={`/admin/ingredientes/${i.id}`} aria-label="Editar" className="rounded-lg p-2 hover:bg-cream"><Pencil className="size-4" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
