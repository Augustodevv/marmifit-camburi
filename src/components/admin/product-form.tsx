import { ActionForm, Check, Field, TextArea } from "@/components/admin/action-form";
import { Panel } from "@/components/admin/page-title";
import { saveProduct } from "@/server/actions/admin";
import { centsToInput } from "@/lib/admin-form";
import { WEEKDAYS } from "@/lib/hours";
import type { Product } from "@/generated/prisma/client";

export function ProductForm({ product, categories }: { product?: Product | null; categories: { id: string; name: string }[] }) {
  const p = product;
  return (
    <ActionForm action={saveProduct} submitLabel={p ? "Salvar alterações" : "Criar produto"} submitVariant="accent" className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Panel title="Informações">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" name="name" defaultValue={p?.name} required />
          <Field label="Slug (URL)" name="slug" defaultValue={p?.slug} hint="Deixe em branco para gerar a partir do nome." />
          <label className="block text-xs font-semibold text-forest">
            Categoria
            <select name="categoryId" defaultValue={p?.categoryId ?? ""} required className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal">
              <option value="" disabled>Selecione</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Field label="Imagem" name="image" defaultValue={p?.image} placeholder="/images/produtos/nome.webp ou https://..." hint="Coloque o arquivo em public/images/produtos/ ou use uma URL https." />
          <TextArea label="Descrição" name="description" defaultValue={p?.description} className="md:col-span-2" />
          <TextArea label="Ingredientes" name="ingredientsText" defaultValue={p?.ingredientsText} className="md:col-span-2" />
          <Field label="Alergênicos (separados por vírgula)" name="allergens" defaultValue={p?.allergens.join(", ")} placeholder="Glúten, Leite, Ovo" />
          <Field label="Tags (separadas por vírgula)" name="tags" defaultValue={p?.tags.join(", ")} placeholder="fitness, mais pedido" />
        </div>
      </Panel>
      <Panel title="Preço e disponibilidade">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Preço base (R$)" name="basePrice" defaultValue={centsToInput(p?.basePrice)} required hint="Para o tamanho de referência (multiplicador 1x)." />
          <Field label="Preço 'de' (R$, promoção)" name="compareAtPrice" defaultValue={centsToInput(p?.compareAtPrice)} hint="Opcional. Exibe o desconto." />
          <Field label="Ordem" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} />
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          <Check label="Varia por tamanho" name="hasSizes" defaultChecked={p?.hasSizes ?? true} />
          <Check label="Ativo no cardápio" name="active" defaultChecked={p?.active ?? true} />
          <Check label="Disponível (em estoque)" name="available" defaultChecked={p?.available ?? true} />
          <Check label="Destaque na home" name="featured" defaultChecked={p?.featured ?? false} />
        </div>
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold text-forest">Marmita do dia (deixe vazio para servir todos os dias)</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {WEEKDAYS.map((d, i) => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="dailyDays" value={i} defaultChecked={p?.dailyDays.includes(i)} className="size-4 accent-[#43865B]" /> {d}
              </label>
            ))}
          </div>
        </fieldset>
      </Panel>
      <Panel title="Informação nutricional (por porção do tamanho de referência)">
        <p className="mb-4 text-xs text-muted-foreground">Preencha somente com dados verificados (laudo, ficha técnica ou tabela oficial). Deixe tudo em branco se não tiver.</p>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Energia (kcal)" name="kcal" type="number" step="0.1" defaultValue={p?.kcal} />
          <Field label="Proteínas (g)" name="proteinG" type="number" step="0.1" defaultValue={p?.proteinG} />
          <Field label="Carboidratos (g)" name="carbsG" type="number" step="0.1" defaultValue={p?.carbsG} />
          <Field label="Gorduras (g)" name="fatG" type="number" step="0.1" defaultValue={p?.fatG} />
          <Field label="Fibras (g)" name="fiberG" type="number" step="0.1" defaultValue={p?.fiberG} />
          <Field label="Sódio (mg)" name="sodiumMg" type="number" step="1" defaultValue={p?.sodiumMg} />
        </div>
        <Field label="Fonte dos dados" name="nutritionSource" defaultValue={p?.nutritionSource} className="mt-4" placeholder="Ex.: Laudo laboratório X, 03/2026" />
      </Panel>
    </ActionForm>
  );
}
