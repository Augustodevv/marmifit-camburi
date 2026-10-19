import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { AdminTitle, Panel } from "@/components/admin/page-title";
import { OrderActions } from "@/components/admin/order-actions";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, STATUS_FLOW, type OrderStatusKey } from "@/lib/constants";
import { formatDateTime } from "@/lib/hours";
import { formatPhone } from "@/lib/format";
import { formatBRL } from "@/lib/pricing";

export const metadata = { title: "Pedido" };

export default async function OrderDetail({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { items: true, events: { orderBy: { createdAt: "asc" } }, user: { select: { email: true } } } });
  if (!o) notFound();
  const status = o.status as OrderStatusKey;
  const next = STATUS_FLOW[status].filter((s) =>
    s === "OUT_FOR_DELIVERY" ? o.fulfillment === "DELIVERY" : s === "READY_FOR_PICKUP" ? o.fulfillment === "PICKUP" : s === "CONFIRMED" ? o.paymentStatus === "APPROVED" : true,
  );
  const addr = o.address as Record<string, string> | null;

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-forest"><ChevronLeft className="size-4" /> Pedidos</Link>
      <AdminTitle title={`Pedido ${o.number}`} description={`${ORDER_STATUS_LABEL[status]} · criado em ${formatDateTime(o.createdAt)}`}>
        <Link href={`/pedido/${o.number}?t=${o.trackingToken}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-leaf">
          Página do cliente <ExternalLink className="size-4" aria-hidden />
        </Link>
      </AdminTitle>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Itens">
          <ul className="divide-y divide-cream-300/70 text-sm">
            {o.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <span>
                  <strong>{i.quantity}x {i.name}</strong>
                  {i.sizeName && <span className="block text-xs text-muted-foreground">{i.sizeName}</span>}
                  {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
                  {i.notes && <span className="block text-xs font-semibold text-[#a35a12]">Obs.: {i.notes}</span>}
                </span>
                <span className="tabular-nums">{formatBRL(i.unitPrice)} un · {formatBRL(i.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-dashed border-cream-300 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatBRL(o.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Entrega</dt><dd>{formatBRL(o.deliveryFee)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between"><dt>Cupom {o.couponCode}</dt><dd>- {formatBRL(o.discount)}</dd></div>}
            {o.pointsDiscount > 0 && <div className="flex justify-between"><dt>Pontos ({o.pointsUsed})</dt><dd>- {formatBRL(o.pointsDiscount)}</dd></div>}
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatBRL(o.total)}</dd></div>
          </dl>
          {o.notes && <p className="mt-4 rounded-lg bg-cream p-3 text-sm"><strong>Observações:</strong> {o.notes}</p>}
        </Panel>
        <div className="space-y-6">
          <Panel title="Ações">
            {next.length ? <OrderActions orderId={o.id} next={next} canMarkPaid={o.paymentMethod === "ON_DELIVERY" && o.paymentStatus !== "APPROVED" && status !== "CANCELED"} /> : <p className="text-sm text-muted-foreground">Pedido finalizado.</p>}
            {status === "PENDING_PAYMENT" && <p className="mt-3 text-xs text-muted-foreground">A confirmação de pagamentos online é automática via webhook do Mercado Pago.</p>}
          </Panel>
          <Panel title="Cliente e entrega">
            <dl className="space-y-1 text-sm">
              <div><dt className="inline font-semibold">Nome: </dt><dd className="inline">{o.customerName}</dd></div>
              <div><dt className="inline font-semibold">Telefone: </dt><dd className="inline">{formatPhone(o.customerPhone)}</dd></div>
              {(o.customerEmail || o.user?.email) && <div><dt className="inline font-semibold">E-mail: </dt><dd className="inline">{o.customerEmail ?? o.user?.email}</dd></div>}
              <div><dt className="inline font-semibold">Modalidade: </dt><dd className="inline">{o.fulfillment === "PICKUP" ? "Retirada" : "Entrega"}</dd></div>
              {addr && <div><dt className="inline font-semibold">Endereço: </dt><dd className="inline">{addr.street}, {addr.number} {addr.complement} · {addr.district} · CEP {addr.zip}{addr.reference ? ` · Ref.: ${addr.reference}` : ""}</dd></div>}
              {o.scheduledFor && <div><dt className="inline font-semibold">Agendado: </dt><dd className="inline">{formatDateTime(o.scheduledFor)}</dd></div>}
              <div><dt className="inline font-semibold">Pagamento: </dt><dd className="inline">{PAYMENT_METHOD_LABEL[o.paymentMethod]} · {PAYMENT_STATUS_LABEL[o.paymentStatus]}{o.mpPaymentId ? ` · MP #${o.mpPaymentId}` : ""}</dd></div>
            </dl>
          </Panel>
          <Panel title="Histórico">
            <ol className="space-y-2 text-sm">
              {o.events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>{ORDER_STATUS_LABEL[e.status]}{e.note ? ` — ${e.note}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
