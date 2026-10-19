import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionButton } from "@/components/admin/action-form";
import { DayPicker } from "@/components/admin/day-picker";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { toggleIngredient, toggleProductFlag } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cardápio do dia" };

const GROUP_LABEL = { PROTEIN: "Proteínas", BASE: "Bases", SIDE: "Acompanhamentos", ADDON: "Adicionais" } as const;

export default async function DailyAdmin() {
  await requireAdmin();
  const today = todayDailyIndex();
  const [products, ingredients] = await Promise.all([
    db.product.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.ingredient.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
  ]);
  const todays = products.filter((p) => p.dailyDays.includes(today));

  return (
    <>
      <AdminTitle title="Cardápio do dia" description={`Hoje é ${WEEKDAYS[today].toLowerCase()}. Ajuste o que está disponível sem mexer em preços.`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Ingredientes do configurador">
          <p className="mb-4 text-xs text-muted-foreground">Toque para marcar como esgotado. O cliente vê o item desabilitado na hora.</p>
          {(Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).map((g) => (
            <div key={g} className="mb-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{GROUP_LABEL[g]}</p>
              <div className="flex flex-wrap gap-2">
                {ingredients.filter((i) => i.group === g).map((i) => (
                  <ActionButton
                    key={i.id}
                    run={toggleIngredient.bind(null, i.id)}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", i.available ? "border-leaf bg-leaf-100 text-leaf" : "border-destructive/40 bg-destructive/10 text-destructive line-through")}
                    label={i.available ? `Marcar ${i.name} como esgotado` : `Marcar ${i.name} como disponível`}
                  >
                    {i.name}
                  </ActionButton>
                ))}
              </div>
            </div>
          ))}
        </Panel>
        <Panel title={`Pratos do dia — hoje (${todays.length})`}>
          {todays.length === 0 && <p className="text-sm text-muted-foreground">Nenhum prato especial marcado para hoje.</p>}
          <ul className="space-y-2">
            {todays.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream p-3 text-sm">
                <span className="font-semibold">{p.name}</span>
                <ActionButton run={toggleProductFlag.bind(null, p.id, "available")} className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.available ? "bg-leaf-100 text-leaf" : "bg-destructive/10 text-destructive")}>
                  {p.available ? "Disponível" : "Esgotado"}
                </ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Disponibilidade e dias de cada prato" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="pb-2">Prato</th><th className="pb-2">Servido em (vazio = todos os dias)</th><th className="pb-2 text-right">Hoje</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-cream-300/70">
                  <td className="py-2.5 pr-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.category.name}</span>
                  </td>
                  <td className="py-2.5"><DayPicker productId={p.id} initial={p.dailyDays} /></td>
                  <td className="py-2.5 text-right">
                    <ActionButton run={toggleProductFlag.bind(null, p.id, "available")} className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.available ? "bg-leaf-100 text-leaf" : "bg-destructive/10 text-destructive")}>
                      {p.available ? "Disponível" : "Esgotado"}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
