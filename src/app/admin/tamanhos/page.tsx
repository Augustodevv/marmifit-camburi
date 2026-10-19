import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionForm, Check, Field } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/admin-form";
import { saveSize } from "@/server/actions/admin";
import type { Size } from "@/generated/prisma/client";

export const metadata = { title: "Tamanhos" };

function SizeFields({ s }: { s?: Size }) {
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Nome" name="name" defaultValue={s?.name} required />
        <Field label="Peso (g)" name="grams" type="number" defaultValue={s?.grams} required />
        <Field label="Preço no configurador (R$)" name="customBasePrice" defaultValue={centsToInput(s?.customBasePrice)} required />
        <Field label="Multiplicador pratos prontos" name="priceMultiplier" defaultValue={s ? (s.priceMultiplier / 10000).toString().replace(".", ",") : "1"} hint="1 = preço base; 1,2 = +20%" />
        <Field label="Ordem" name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} />
        <div className="flex items-end pb-2"><Check label="Ativo" name="active" defaultChecked={s?.active ?? true} /></div>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Limites de escolha</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-4">
        <Field label="Proteínas" name="maxProteins" type="number" defaultValue={s?.maxProteins ?? 1} />
        <Field label="Bases" name="maxBases" type="number" defaultValue={s?.maxBases ?? 1} />
        <Field label="Acompanhamentos" name="maxSides" type="number" defaultValue={s?.maxSides ?? 2} />
        <Field label="Adicionais" name="maxAddons" type="number" defaultValue={s?.maxAddons ?? 4} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Gramagem por grupo (usada no cálculo nutricional)</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Field label="Proteína (g)" name="proteinGrams" type="number" defaultValue={s?.proteinGrams ?? 120} />
        <Field label="Base (g)" name="baseGrams" type="number" defaultValue={s?.baseGrams ?? 150} />
        <Field label="Acompanhamentos (g)" name="sidesGrams" type="number" defaultValue={s?.sidesGrams ?? 100} />
      </div>
    </>
  );
}

export default async function SizesAdmin() {
  await requireOwner();
  const sizes = await db.size.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <AdminTitle title="Tamanhos" description="Preço da marmita personalizada, multiplicador dos pratos prontos e limites do configurador." />
      <div className="space-y-4">
        {sizes.map((s) => (
          <Panel key={s.id} title={`${s.name} · ${s.grams} g`}>
            <ActionForm action={saveSize}><SizeFields s={s} /></ActionForm>
          </Panel>
        ))}
        <Panel title="Novo tamanho">
          <ActionForm action={saveSize} submitLabel="Criar tamanho" resetOnSuccess><SizeFields /></ActionForm>
        </Panel>
      </div>
    </>
  );
}
