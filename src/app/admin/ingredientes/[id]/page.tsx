import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionForm, Check, Field, TextArea } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/admin-form";
import { saveIngredient } from "@/server/actions/admin";

export const metadata = { title: "Ingrediente" };

export default async function IngredientEdit({ params }: PageProps<"/admin/ingredientes/[id]">) {
  await requireOwner();
  const { id } = await params;
  const i = id === "novo" ? null : await db.ingredient.findUnique({ where: { id } });
  if (id !== "novo" && !i) notFound();
  return (
    <>
      <Link href="/admin/ingredientes" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-forest"><ChevronLeft className="size-4" /> Ingredientes</Link>
      <AdminTitle title={i ? i.name : "Novo ingrediente"} />
      <ActionForm action={saveIngredient} submitVariant="accent" submitLabel={i ? "Salvar" : "Criar ingrediente"} className="space-y-6">
        {i && <input type="hidden" name="id" value={i.id} />}
        <Panel title="Dados">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Nome" name="name" defaultValue={i?.name} required />
            <Field label="Slug" name="slug" defaultValue={i?.slug} />
            <label className="block text-xs font-semibold text-forest">
              Grupo
              <select name="group" defaultValue={i?.group ?? "SIDE"} className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal">
                <option value="PROTEIN">Proteína</option>
                <option value="BASE">Base</option>
                <option value="SIDE">Acompanhamento</option>
                <option value="ADDON">Adicional</option>
              </select>
            </label>
            <Field label="Acréscimo no preço (R$)" name="price" defaultValue={centsToInput(i?.price ?? 0)} hint="0 = incluso" />
            <Field label="Preço da porção extra (R$)" name="extraPrice" defaultValue={centsToInput(i?.extraPrice)} hint="Só para proteínas. Vazio = sem porção extra." />
            <Field label="Gramas (porção extra / adicional)" name="extraGrams" type="number" defaultValue={i?.extraGrams} hint="Proteína: gramas da porção extra. Adicional: gramas da porção." />
            <Field label="Alergênicos (vírgula)" name="allergens" defaultValue={i?.allergens.join(", ")} placeholder="Leite, Ovo" />
            <Field label="Imagem" name="image" defaultValue={i?.image} placeholder="/images/ingredientes/..." />
            <Field label="Ordem" name="sortOrder" type="number" defaultValue={i?.sortOrder ?? 0} />
            <TextArea label="Descrição" name="description" defaultValue={i?.description} className="md:col-span-3" rows={2} />
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <Check label="Disponível" name="available" defaultChecked={i?.available ?? true} />
            <Check label="Vegetariano" name="isVegetarian" defaultChecked={i?.isVegetarian} />
            <Check label="Vegano" name="isVegan" defaultChecked={i?.isVegan} />
            <Check label="Low carb" name="isLowCarb" defaultChecked={i?.isLowCarb} />
          </div>
        </Panel>
        <Panel title="Nutrição por 100 g (dados verificados)">
          <p className="mb-4 text-xs text-muted-foreground">
            O configurador só mostra informação nutricional quando todos os itens escolhidos têm os 6 campos e a fonte preenchidos.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Energia (kcal)" name="kcalPer100g" type="number" step="0.1" defaultValue={i?.kcalPer100g} />
            <Field label="Proteínas (g)" name="proteinPer100g" type="number" step="0.1" defaultValue={i?.proteinPer100g} />
            <Field label="Carboidratos (g)" name="carbsPer100g" type="number" step="0.1" defaultValue={i?.carbsPer100g} />
            <Field label="Gorduras (g)" name="fatPer100g" type="number" step="0.1" defaultValue={i?.fatPer100g} />
            <Field label="Fibras (g)" name="fiberPer100g" type="number" step="0.1" defaultValue={i?.fiberPer100g} />
            <Field label="Sódio (mg)" name="sodiumMgPer100g" type="number" step="1" defaultValue={i?.sodiumMgPer100g} />
          </div>
          <Field label="Fonte" name="nutritionSource" defaultValue={i?.nutritionSource} className="mt-4" placeholder="Ex.: TACO 4ª edição (NEPA/UNICAMP), item 'Arroz, integral, cozido'" />
        </Panel>
      </ActionForm>
    </>
  );
}
