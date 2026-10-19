import Link from "next/link";
import { AlertCircle, CircleDollarSign, Package, Receipt, Store } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/page-title";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { AutoRefresh } from "@/components/store/auto-refresh";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime, isOpenAt } from "@/lib/hours";
import { formatBRL } from "@/lib/pricing";
import { getSettings } from "@/server/catalog";
import { revenueByDay, startOfLocalDay, summary, topProducts } from "@/server/reports";
import { isMercadoPagoConfigured } from "@/server/mercadopago";

export default async function AdminHome() {
  const today = startOfLocalDay(0);
  const twoWeeks = startOfLocalDay(13);
  const now = new Date();
  const [todaySum, chart, top, latest, settings, unavailable] = await Promise.all([
    summary(today, now),
    revenueByDay(twoWeeks, now),
    topProducts(startOfLocalDay(6), now, 5),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    getSettings(),
    db.ingredient.count({ where: { available: false } }),
  ]);
  const open = settings.acceptingOrders && isOpenAt(settings.hours, now);
  const active = await db.order.count({ where: { status: { in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP"] } } });

  const kpis = [
    { label: "Faturamento hoje", value: formatBRL(todaySum.revenue), icon: CircleDollarSign },
    { label: "Pedidos hoje", value: String(todaySum.orders), icon: Receipt },
    { label: "Ticket médio", value: formatBRL(todaySum.avgTicket), icon: Package },
    { label: "Em andamento", value: String(active), icon: Store },
  ];

  return (
    <>
      <AutoRefresh seconds={30} />
      <AdminTitle title="Visão geral" description={`Loja ${open ? "aberta" : "fechada"} agora${settings.acceptingOrders ? "" : " · pedidos pausados"}`}>
        <Link href="/admin/pedidos" className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream">Ver pedidos</Link>
      </AdminTitle>

      {(!isMercadoPagoConfigured() || !settings.whatsappNumber || unavailable > 0) && (
        <div className="mb-6 space-y-2">
          {!isMercadoPagoConfigured() && (
            <Notice>Pagamento online desativado: configure MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_WEBHOOK_SECRET (veja o README).</Notice>
          )}
          {!settings.whatsappNumber && (
            <Notice>
              Cadastre o WhatsApp da loja em <Link href="/admin/configuracoes" className="underline">Entrega e horários</Link> para ativar os botões de WhatsApp.
            </Notice>
          )}
          {unavailable > 0 && (
            <Notice>
              {unavailable} ingrediente(s) marcado(s) como indisponível. <Link href="/admin/cardapio-do-dia" className="underline">Revisar</Link>
            </Notice>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-cream-300 bg-white p-5 shadow-soft">
            <k.icon className="size-5 text-leaf" aria-hidden />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-forest">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Faturamento — últimos 14 dias">
          <RevenueChart data={chart} />
        </Panel>
        <Panel title="Mais vendidos (7 dias)">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {top.map((t, i) => (
                <li key={t.name} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-leaf-100 text-xs font-bold text-leaf">{i + 1}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="text-muted-foreground">{t.quantity} un</span>
                  <span className="w-24 text-right font-semibold tabular-nums">{formatBRL(t.total)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Últimos pedidos" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">Pedido</th><th className="pb-2">Cliente</th><th className="pb-2">Status</th><th className="pb-2">Quando</th><th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((o) => (
                <tr key={o.id} className="border-t border-cream-300/70">
                  <td className="py-2.5"><Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-leaf hover:underline">{o.number}</Link></td>
                  <td>{o.customerName}</td>
                  <td>{ORDER_STATUS_LABEL[o.status]}</td>
                  <td className="text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  <td className="text-right font-semibold tabular-nums">{formatBRL(o.total)}</td>
                </tr>
              ))}
              {latest.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-tangerine/50 bg-tangerine-100 p-3 text-sm text-forest">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#a35a12]" aria-hidden /> <span>{children}</span>
    </p>
  );
}
