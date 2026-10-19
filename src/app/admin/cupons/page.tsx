import { AdminTitle, Panel } from "@/components/admin/page-title";
import { ActionButton, ActionForm, Field } from "@/components/admin/action-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { saveCoupon, toggleCoupon } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cupons" };

export default async function CouponsAdmin() {
  await requireOwner();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminTitle title="Cupons e promoções" description="Para preços promocionais em pratos, use o campo “Preço de” no produto." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2">Código</th><th className="pb-2">Desconto</th><th className="pb-2">Mínimo</th><th className="pb-2">Usos</th><th className="pb-2">Validade</th><th className="pb-2" /></tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className={cn("border-t border-cream-300/70", !c.active && "opacity-50")}>
                    <td className="py-2.5 font-mono font-bold">{c.code}</td>
                    <td>{c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}</td>
                    <td>{c.minOrder ? formatBRL(c.minOrder) : "—"}</td>
                    <td>{c.usedCount}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</td>
                    <td>{c.expiresAt ? c.expiresAt.toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="text-right">
                      <ActionButton run={toggleCoupon.bind(null, c.id)} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-cream">
                        {c.active ? "Desativar" : "Ativar"}
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Novo cupom">
          <ActionForm action={saveCoupon} submitLabel="Criar cupom" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Código" name="code" required placeholder="SEMANA15" />
              <label className="block text-xs font-semibold text-forest">
                Tipo
                <select name="type" className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal">
                  <option value="PERCENT">Percentual (%)</option>
                  <option value="FIXED">Valor fixo (R$)</option>
                </select>
              </label>
              <Field label="Valor" name="value" required placeholder="10 ou 5,00" />
              <Field label="Pedido mínimo (R$)" name="minOrder" placeholder="0,00" />
              <Field label="Limite de usos" name="maxUses" type="number" hint="Vazio = ilimitado" />
              <Field label="Válido até" name="expiresAt" type="date" />
              <Field label="Descrição (aparece na página de promoções)" name="description" className="sm:col-span-2" />
            </div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
