import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionForm, Check, Field } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveCategory } from "@/server/actions/admin";

export const metadata = { title: "Categorias" };

export default async function CategoriesAdmin() {
  await requireOwner();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <AdminTitle title="Categorias" description="Crie, renomeie, reordene e oculte categorias do cardápio." />
      <div className="space-y-4">
        {categories.map((c) => (
          <Panel key={c.id}>
            <ActionForm action={saveCategory} className="grid items-end gap-3 md:grid-cols-[1.2fr_1fr_1.6fr_80px_auto]" inlineSubmit>
              <input type="hidden" name="id" value={c.id} />
              <Field label={`Nome (${c._count.products} produtos)`} name="name" defaultValue={c.name} required />
              <Field label="Slug" name="slug" defaultValue={c.slug} />
              <Field label="Descrição" name="description" defaultValue={c.description} />
              <Field label="Ordem" name="sortOrder" type="number" defaultValue={c.sortOrder} />
              <div className="flex flex-wrap items-center gap-3 pb-2">
                <Check label="Ativa" name="active" defaultChecked={c.active} />
                <Check label="Combo" name="isCombo" defaultChecked={c.isCombo} />
              </div>
              <Field label="Imagem" name="image" defaultValue={c.image} placeholder="/images/categorias/..." className="md:col-span-4" />
            </ActionForm>
          </Panel>
        ))}
        <Panel title="Nova categoria">
          <ActionForm action={saveCategory} className="grid items-end gap-3 md:grid-cols-4" submitLabel="Criar categoria" resetOnSuccess>
            <Field label="Nome" name="name" required />
            <Field label="Descrição" name="description" />
            <Field label="Ordem" name="sortOrder" type="number" defaultValue={categories.length} />
            <div className="flex gap-3 pb-2">
              <Check label="Ativa" name="active" defaultChecked />
              <Check label="Combo" name="isCombo" />
            </div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
