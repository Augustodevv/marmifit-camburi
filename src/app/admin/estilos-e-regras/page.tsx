import { Trash2 } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionButton, ActionForm, Check, Field } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { createRule, deleteRule, saveStyle, toggleRule } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Estilos e regras" };

export default async function StylesAdmin() {
  await requireOwner();
  const [styles, rules, ingredients, sizes] = await Promise.all([
    db.style.findMany({ orderBy: { sortOrder: "asc" } }),
    db.combinationRule.findMany({ include: { ingredient: true, conflictIngredient: true, size: true } }),
    db.ingredient.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    db.size.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const select = "mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal";
  return (
    <>
      <AdminTitle title="Estilos e regras de combinação" description="Os estilos filtram ingredientes; as regras impedem combinações indisponíveis." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">Estilos</h2>
          {[...styles, null].map((s) => (
            <Panel key={s?.id ?? "novo"} title={s ? undefined : "Novo estilo"}>
              <ActionForm action={saveStyle} submitLabel={s ? "Salvar" : "Criar estilo"} resetOnSuccess={!s}>
                {s && <input type="hidden" name="id" value={s.id} />}
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Nome" name="name" defaultValue={s?.name} required />
                  <Field label="Descrição" name="description" defaultValue={s?.description} />
                  <Field label="Ordem" name="sortOrder" type="number" defaultValue={s?.sortOrder ?? styles.length} />
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  <Check label="Só vegetariano" name="requireVegetarian" defaultChecked={s?.requireVegetarian} />
                  <Check label="Só vegano" name="requireVegan" defaultChecked={s?.requireVegan} />
                  <Check label="Só low carb (bases e acomp.)" name="requireLowCarb" defaultChecked={s?.requireLowCarb} />
                  <Check label="Ativo" name="active" defaultChecked={s?.active ?? true} />
                </div>
              </ActionForm>
            </Panel>
          ))}
        </div>
        <div className="space-y-4">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">Regras de combinação</h2>
          <Panel>
            <ul className="space-y-2">
              {rules.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma regra.</li>}
              {rules.map((r) => (
                <li key={r.id} className={cn("flex items-start justify-between gap-3 rounded-xl bg-cream p-3 text-sm", !r.active && "opacity-50")}>
                  <div>
                    <p className="font-semibold">
                      {r.ingredient.name} ✕ {r.conflictIngredient ? r.conflictIngredient.name : `tamanho ${r.size?.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Mensagem: “{r.description}”</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <ActionButton run={toggleRule.bind(null, r.id)} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white">
                      {r.active ? "Desativar" : "Ativar"}
                    </ActionButton>
                    <ActionButton run={deleteRule.bind(null, r.id)} confirm="Excluir esta regra?" className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10" label="Excluir regra">
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Nova regra">
            <ActionForm action={createRule} submitLabel="Criar regra" resetOnSuccess>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-forest">
                  Ingrediente
                  <select name="ingredientId" required className={select} defaultValue="">
                    <option value="" disabled>Selecione</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-forest">
                  Não combina com o ingrediente
                  <select name="conflictIngredientId" className={select} defaultValue="">
                    <option value="">—</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-forest">
                  ou não disponível no tamanho
                  <select name="sizeId" className={select} defaultValue="">
                    <option value="">—</option>
                    {sizes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <Field label="Mensagem para o cliente" name="description" required placeholder="Ex.: Tilápia não é servida no tamanho Família." />
              </div>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
