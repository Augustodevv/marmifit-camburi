import Link from "next/link";
import { Download } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/page-title";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requireOwner } from "@/lib/auth";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatBRL } from "@/lib/pricing";
import { localParts } from "@/lib/hours";
import { revenueByDay, summary, topProducts } from "@/server/reports";

export const metadata = { title: "Relatórios" };

function parseRange(sp: Record<string, string | string[] | undefined>) {
  const today = localParts(new Date()).ymd;
  const def = localParts(new Date(Date.now() - 29 * 86_400_000)).ymd;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const de = typeof sp.de === "string" && re.test(sp.de) ? sp.de : def;
  const ate = typeof sp.ate === "string" && re.test(sp.ate) ? sp.ate : today;
  return { de, ate, from: new Date(`${de}T00:00:00-03:00`), to: new Date(`${ate}T23:59:59-03:00`) };
}

export default async function ReportsAdmin({ searchParams }: PageProps<"/admin/relatorios">) {
  await requireOwner();
  const { de, ate, from, to } = parseRange(await searchParams);
  const [sum, daily, top] = await Promise.all([summary(from, to), revenueByDay(from, to), topProducts(from, to, 15)]);
  const kpis = [
    ["Faturamento", formatBRL(sum.revenue)],
    ["Pedidos", String(sum.orders)],
    ["Ticket médio", formatBRL(sum.avgTicket)],
    ["Descontos concedidos", formatBRL(sum.discounts)],
    ["Taxas de entrega", formatBRL(sum.deliveryFees)],
    ["Cancelados", String(sum.canceled)],
  ];
  return (
    <>
      <AdminTitle title="Relatórios" description="Faturamento considera pedidos confirmados em diante (exclui cancelados e aguardando pagamento).">
        <Link href={`/admin/relatorios/csv?de=${de}&ate=${ate}`} className="inline-flex items-center gap-2 rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-sm font-semibold text-forest">
          <Download className="size-4" aria-hidden /> Exportar CSV
        </Link>
      </AdminTitle>
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-forest">De<input type="date" name="de" defaultValue={de} className="mt-1 block h-10 rounded-lg border border-input bg-white px-2 text-sm" /></label>
        <label className="text-xs font-semibold text-forest">Até<input type="date" name="ate" defaultValue={ate} className="mt-1 block h-10 rounded-lg border border-input bg-white px-2 text-sm" /></label>
        <button className="h-10 rounded-lg bg-forest px-4 text-sm font-semibold text-cream">Aplicar</button>
      </form>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-cream-300 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-forest">{v}</p>
          </div>
        ))}
      </div>
      {daily.length <= 92 && (
        <Panel title="Faturamento diário" className="mt-6">
          <RevenueChart data={daily} />
        </Panel>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Produtos mais vendidos">
          <table className="w-full text-sm">
            <tbody>
              {top.map((t) => (
                <tr key={t.name} className="border-t border-cream-300/70 first:border-0">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2 text-right text-muted-foreground">{t.quantity} un</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{formatBRL(t.total)}</td>
                </tr>
              ))}
              {top.length === 0 && <tr><td className="py-4 text-muted-foreground">Sem vendas no período.</td></tr>}
            </tbody>
          </table>
        </Panel>
        <Panel title="Por forma de pagamento e modalidade">
          <ul className="space-y-2 text-sm">
            {sum.byPayment.map((p) => (
              <li key={p.method} className="flex justify-between"><span>{PAYMENT_METHOD_LABEL[p.method]} ({p.count})</span><strong>{formatBRL(p.total)}</strong></li>
            ))}
            {sum.byFulfillment.map((f) => (
              <li key={f.fulfillment} className="flex justify-between text-muted-foreground"><span>{f.fulfillment === "PICKUP" ? "Retirada" : "Entrega"}</span><span>{f.count} pedidos</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
