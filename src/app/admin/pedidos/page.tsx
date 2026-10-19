import Link from "next/link";
import { CalendarClock, MapPin, MessageCircle, Phone, Store } from "lucide-react";
import { AdminTitle } from "@/components/admin/page-title";
import { NewOrderAlert, OrderActions } from "@/components/admin/order-actions";
import { AutoRefresh } from "@/components/store/auto-refresh";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_FLOW, type OrderStatusKey } from "@/lib/constants";
import { formatDateTime } from "@/lib/hours";
import { formatPhone } from "@/lib/format";
import { formatBRL } from "@/lib/pricing";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Pedidos" };

const FILTERS: { id: string; label: string; where: Prisma.OrderWhereInput }[] = [
  { id: "ativos", label: "Ativos", where: { status: { in: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP"] } } },
  { id: "pagamento", label: "Aguardando pagamento", where: { status: "PENDING_PAYMENT" } },
  { id: "agendados", label: "Agendados", where: { scheduledFor: { not: null }, status: { notIn: ["DELIVERED", "CANCELED"] } } },
  { id: "entregues", label: "Entregues", where: { status: "DELIVERED" } },
  { id: "cancelados", label: "Cancelados", where: { status: "CANCELED" } },
  { id: "todos", label: "Todos", where: {} },
];

const STATUS_TONE: Record<OrderStatusKey, string> = {
  PENDING_PAYMENT: "bg-tangerine-100 text-[#8a4a0c]",
  CONFIRMED: "bg-tangerine text-forest",
  PREPARING: "bg-leaf-100 text-leaf",
  OUT_FOR_DELIVERY: "bg-forest text-cream",
  READY_FOR_PICKUP: "bg-forest text-cream",
  DELIVERED: "bg-cream-200 text-forest",
  CANCELED: "bg-destructive/10 text-destructive",
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.id === sp.f) ?? FILTERS[0];
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where: Prisma.OrderWhereInput = {
    ...filter.where,
    ...(q ? { OR: [{ number: { contains: q.toUpperCase() } }, { customerName: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q.replace(/\D/g, "") || q } }] } : {}),
  };
  const [orders, counts, latest] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: filter.id === "ativos" || filter.id === "agendados" ? [{ scheduledFor: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }] : { createdAt: "desc" },
      take: 60,
      include: { items: true },
    }),
    Promise.all(FILTERS.slice(0, 3).map((f) => db.order.count({ where: f.where }))),
    db.order.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, number: true } }),
  ]);

  return (
    <>
      <AutoRefresh seconds={15} />
      <AdminTitle title="Pedidos" description="Atualiza sozinho a cada 15 segundos.">
        <NewOrderAlert latestId={latest?.id ?? null} latestNumber={latest?.number ?? null} />
      </AdminTitle>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1" aria-label="Filtro">
          {FILTERS.map((f, i) => (
            <Link
              key={f.id}
              href={`/admin/pedidos?f=${f.id}`}
              className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", f.id === filter.id ? "bg-forest text-cream" : "bg-white text-forest hover:bg-cream-200")}
            >
              {f.label}
              {i < 3 && counts[i] > 0 && <span className="ml-1.5 rounded-full bg-tangerine px-1.5 text-xs text-forest">{counts[i]}</span>}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2">
          <input type="hidden" name="f" value={filter.id} />
          <input name="q" defaultValue={q} placeholder="Número, nome ou telefone" aria-label="Buscar pedido" className="h-10 w-64 rounded-xl border border-input bg-white px-3 text-sm" />
          <button className="rounded-xl bg-forest px-4 text-sm font-semibold text-cream">Buscar</button>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-300 bg-white p-12 text-center text-muted-foreground">Nenhum pedido neste filtro.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((o) => {
            const status = o.status as OrderStatusKey;
            const addr = o.address as { street?: string; number?: string; complement?: string; district?: string; reference?: string } | null;
            const next = STATUS_FLOW[status].filter((s) =>
              s === "OUT_FOR_DELIVERY" ? o.fulfillment === "DELIVERY" : s === "READY_FOR_PICKUP" ? o.fulfillment === "PICKUP" : s === "CONFIRMED" ? o.paymentStatus === "APPROVED" : true,
            );
            const customerMsg = `Olá, ${o.customerName.split(" ")[0]}! Seu pedido ${o.number} na Marmifit está: ${ORDER_STATUS_LABEL[status]}.`;
            return (
              <article key={o.id} className="rounded-2xl border border-cream-300 bg-white p-5 shadow-soft">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/pedidos/${o.id}`} className="font-display text-xl font-semibold text-forest hover:underline">{o.number}</Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_TONE[status])}>{ORDER_STATUS_LABEL[status]}</span>
                </header>
                {o.scheduledFor && (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-tangerine-100 px-3 py-2 text-sm font-semibold text-forest">
                    <CalendarClock className="size-4" aria-hidden /> Agendado: {formatDateTime(o.scheduledFor)}
                  </p>
                )}
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id}>
                      <strong>{i.quantity}x</strong> {i.name}
                      {i.sizeName && <span className="text-muted-foreground"> · {i.sizeName}</span>}
                      {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
                      {i.notes && <span className="block text-xs font-semibold text-[#a35a12]">Obs.: {i.notes}</span>}
                    </li>
                  ))}
                </ul>
                {o.notes && <p className="mt-2 rounded-lg bg-cream p-2 text-xs"><strong>Obs. do pedido:</strong> {o.notes}</p>}
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-1.5"><Phone className="size-3.5" aria-hidden /> {o.customerName} · {formatPhone(o.customerPhone)}</p>
                  <p className="flex items-center gap-1.5">
                    {o.fulfillment === "PICKUP" ? <><Store className="size-3.5" aria-hidden /> Retirada</> : <><MapPin className="size-3.5" aria-hidden /> {addr?.street}, {addr?.number}{addr?.complement ? ` - ${addr.complement}` : ""} · {addr?.district}</>}
                  </p>
                  <p>{PAYMENT_METHOD_LABEL[o.paymentMethod]} · <strong className={o.paymentStatus === "APPROVED" ? "text-leaf" : ""}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</strong></p>
                  <p className="font-semibold text-forest">Total {formatBRL(o.total)}{o.couponCode ? ` · cupom ${o.couponCode}` : ""}</p>
                </div>
                <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cream-300/70 pt-4">
                  <OrderActions orderId={o.id} next={next} canMarkPaid={o.paymentMethod === "ON_DELIVERY" && o.paymentStatus !== "APPROVED" && status !== "CANCELED"} />
                  <a href={whatsappLink(o.customerPhone, customerMsg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf hover:underline">
                    <MessageCircle className="size-4" aria-hidden /> Avisar cliente
                  </a>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
