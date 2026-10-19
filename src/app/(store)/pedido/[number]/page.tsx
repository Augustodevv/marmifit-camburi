import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChefHat, CircleDashed, Bike, PackageCheck, Store, XCircle, MessageCircle, Clock, MapPin } from "lucide-react";
import { AutoRefresh } from "@/components/store/auto-refresh";
import { PayButton } from "@/components/store/pay-button";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type OrderStatusKey } from "@/lib/constants";
import { formatDateTime } from "@/lib/hours";
import { formatBRL } from "@/lib/pricing";
import { orderWhatsappText, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { getSettings } from "@/server/catalog";
import { getAccessibleOrder } from "@/server/order-access";
import { isMercadoPagoConfigured, syncPayment } from "@/server/mercadopago";

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/pedido/[number]">) {
  const { number } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : undefined;

  // Retorno do Mercado Pago: confirmamos consultando a API, nunca pelos parâmetros da URL.
  const paymentId = typeof sp.payment_id === "string" ? sp.payment_id : typeof sp.collection_id === "string" ? sp.collection_id : null;
  if (paymentId && isMercadoPagoConfigured() && token) {
    await syncPayment(paymentId).catch((e) => console.error("syncPayment", e));
  }

  const [order, settings] = await Promise.all([getAccessibleOrder(number, token), getSettings()]);
  if (!order) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-4xl font-semibold text-forest">Pedido não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Confira o link recebido ou busque pelo número e telefone.</p>
        <Link href="/acompanhar" className={cn(buttonVariants({ size: "xl" }), "mt-8")}>Buscar pedido</Link>
      </div>
    );
  }

  const status = order.status as OrderStatusKey;
  const isPickup = order.fulfillment === "PICKUP";
  const steps: { key: OrderStatusKey; label: string; icon: typeof ChefHat }[] = [
    { key: "CONFIRMED", label: "Confirmado", icon: CheckCircle2 },
    { key: "PREPARING", label: "Em preparo", icon: ChefHat },
    isPickup ? { key: "READY_FOR_PICKUP", label: "Pronto para retirada", icon: Store } : { key: "OUT_FOR_DELIVERY", label: "Saiu para entrega", icon: Bike },
    { key: "DELIVERED", label: isPickup ? "Retirado" : "Entregue", icon: PackageCheck },
  ];
  const reached = (key: OrderStatusKey) => order.events.some((e) => e.status === key);
  const currentIndex = steps.findIndex((s) => s.key === status);
  const final = status === "DELIVERED" || status === "CANCELED";
  const trackingUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/pedido/${order.number}?t=${order.trackingToken}`;
  const address = order.address as { street?: string; number?: string; district?: string; complement?: string } | null;

  return (
    <div className="container-page max-w-4xl py-10">
      <AutoRefresh seconds={20} enabled={!final} />
      {sp.novo === "1" && (
        <div className="mb-6 rounded-2xl bg-leaf p-5 text-white shadow-lift">
          <p className="font-display text-2xl font-semibold">Pedido recebido! 🎉</p>
          <p className="mt-1 text-sm text-white/85">Guarde este link para acompanhar. Avisamos aqui a cada mudança de status.</p>
        </div>
      )}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">Pedido {order.number}</p>
      <h1 className="mt-2 text-4xl font-semibold text-forest sm:text-5xl">{ORDER_STATUS_LABEL[status]}</h1>
      <p className="mt-2 text-muted-foreground">
        Feito em {formatDateTime(order.createdAt)}
        {order.scheduledFor && <> · Agendado para <strong className="text-forest">{formatDateTime(order.scheduledFor)}</strong></>}
      </p>

      {status === "PENDING_PAYMENT" && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-tangerine bg-tangerine-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-forest">Aguardando confirmação do pagamento ({PAYMENT_METHOD_LABEL[order.paymentMethod]})</p>
            <p className="text-sm text-forest/75">Assim que o Mercado Pago aprovar, seu pedido entra em preparo automaticamente.</p>
          </div>
          {isMercadoPagoConfigured() && order.paymentStatus !== "APPROVED" && <PayButton number={order.number} token={token} />}
        </div>
      )}

      {status === "CANCELED" ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-destructive/10 p-5 text-destructive">
          <XCircle className="size-6" aria-hidden /> Este pedido foi cancelado. Em caso de dúvida, fale com a gente.
        </div>
      ) : (
        <ol className="mt-10 grid gap-4 sm:grid-cols-4" aria-label="Etapas do pedido">
          {steps.map((s, i) => {
            const done = reached(s.key) || i < currentIndex;
            const isCurrent = s.key === status;
            const Icon = done || isCurrent ? s.icon : CircleDashed;
            return (
              <li key={s.key} className="relative flex items-center gap-3 sm:flex-col sm:text-center" aria-current={isCurrent ? "step" : undefined}>
                <span
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl transition",
                    isCurrent ? "bg-tangerine text-forest shadow-lift" : done ? "bg-leaf text-white" : "bg-cream-200 text-muted-foreground",
                    isCurrent && !final && "animate-pulse",
                  )}
                >
                  <Icon className="size-7" aria-hidden />
                </span>
                <span className={cn("text-sm font-semibold", done || isCurrent ? "text-forest" : "text-muted-foreground")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-forest">Itens</h2>
          <ul className="mt-4 divide-y divide-cream-300/70 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <span>
                  <span className="font-semibold">{i.quantity}x {i.name}</span>
                  {i.sizeName && <span className="block text-xs text-muted-foreground">{i.sizeName}</span>}
                  {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
                  {i.notes && <span className="block text-xs italic text-muted-foreground">Obs.: {i.notes}</span>}
                </span>
                <span className="tabular-nums">{formatBRL(i.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-dashed border-cream-300 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBRL(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Entrega</dt><dd>{order.deliveryFee ? formatBRL(order.deliveryFee) : "Grátis"}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-leaf"><dt>Cupom {order.couponCode}</dt><dd>- {formatBRL(order.discount)}</dd></div>}
            {order.pointsDiscount > 0 && <div className="flex justify-between text-leaf"><dt>Pontos</dt><dd>- {formatBRL(order.pointsDiscount)}</dd></div>}
            <div className="flex justify-between pt-2 text-base font-semibold text-forest"><dt>Total</dt><dd>{formatBRL(order.total)}</dd></div>
          </dl>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-cream-300 bg-white p-6 shadow-soft text-sm">
            <h2 className="text-xl font-semibold text-forest">Detalhes</h2>
            <p className="mt-3 flex gap-2">
              {isPickup ? <Store className="size-4 shrink-0 text-leaf" aria-hidden /> : <MapPin className="size-4 shrink-0 text-leaf" aria-hidden />}
              {isPickup ? `Retirada: ${settings.pickupAddress}` : address ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""} · ${address.district}` : "Entrega"}
            </p>
            <p className="mt-2 flex gap-2">
              <Clock className="size-4 shrink-0 text-leaf" aria-hidden />
              {PAYMENT_METHOD_LABEL[order.paymentMethod]} · {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </p>
            {order.pointsEarned > 0 && order.userId && (
              <p className="mt-2 text-xs text-muted-foreground">Você ganha {order.pointsEarned} pontos quando o pedido for entregue.</p>
            )}
          </div>
          {settings.whatsappNumber && (
            <a
              href={whatsappLink(settings.whatsappNumber, orderWhatsappText({ ...order, trackingUrl }))}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "xl" }), "w-full bg-[#1f7a4d] hover:bg-[#1a6942]")}
            >
              <MessageCircle className="size-5" aria-hidden /> Falar sobre o pedido no WhatsApp
            </a>
          )}
          <ol className="space-y-2 rounded-3xl border border-cream-300 bg-white p-6 text-xs shadow-soft">
            <li className="text-sm font-semibold text-forest">Histórico</li>
            {order.events.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>{ORDER_STATUS_LABEL[e.status]}{e.note ? ` — ${e.note}` : ""}</span>
                <span className="shrink-0 text-muted-foreground">{formatDateTime(e.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
