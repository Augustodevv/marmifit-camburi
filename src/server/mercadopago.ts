import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

const API = "https://api.mercadopago.com";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function mp<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface OrderLike {
  id: string;
  number: string;
  trackingToken: string;
  total: number;
  customerName: string;
  customerEmail: string | null;
}

/**
 * Cria uma preferência do Checkout Pro. Os dados do cartão são digitados
 * no ambiente do Mercado Pago; a loja nunca recebe dados sensíveis.
 * Enviamos um único item com o total já calculado no servidor.
 */
export async function createPreference(
  order: OrderLike,
  lines: { name: string; quantity: number }[],
  method: "PIX" | "CARD",
) {
  const back = `${siteUrl()}/pedido/${order.number}?t=${order.trackingToken}`;
  const isPublicUrl = !/localhost|127\.0\.0\.1/.test(siteUrl());
  const body = {
    external_reference: order.id,
    statement_descriptor: "MARMIFIT",
    items: [
      {
        id: order.number,
        title: `Pedido ${order.number} - Marmifit Camburi`,
        description: lines.map((l) => `${l.quantity}x ${l.name}`).join(", ").slice(0, 250),
        quantity: 1,
        currency_id: "BRL",
        unit_price: order.total / 100,
      },
    ],
    payer: { name: order.customerName, ...(order.customerEmail ? { email: order.customerEmail } : {}) },
    payment_methods:
      method === "PIX"
        ? { excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }], installments: 1 }
        : { excluded_payment_types: [{ id: "bank_transfer" }, { id: "ticket" }], installments: 3 },
    back_urls: { success: back, pending: back, failure: back },
    ...(isPublicUrl ? { auto_return: "approved", notification_url: `${siteUrl()}/api/webhooks/mercadopago` } : {}),
    expires: true,
    expiration_date_to: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  const pref = await mp<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "X-Idempotency-Key": `pref-${order.id}` },
  });
  return { id: pref.id, initPoint: pref.init_point };
}

interface MpPayment {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
}

const STATUS_MAP: Record<string, "APPROVED" | "REJECTED" | "REFUNDED" | "PENDING"> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "REJECTED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

/**
 * Consulta o pagamento direto na API do Mercado Pago (fonte confiável) e
 * atualiza o pedido. Confere referência e valor antes de aprovar.
 */
export async function syncPayment(paymentId: string) {
  if (!/^\d+$/.test(paymentId)) return { ok: false, reason: "invalid id" };
  const payment = await mp<MpPayment>(`/v1/payments/${paymentId}`);
  if (!payment.external_reference) return { ok: false, reason: "no reference" };
  const order = await db.order.findUnique({ where: { id: payment.external_reference } });
  if (!order) return { ok: false, reason: "order not found" };

  const status = STATUS_MAP[payment.status] ?? "PENDING";
  const amountOk = Math.round(payment.transaction_amount * 100) === order.total && payment.currency_id === "BRL";

  if (status === "APPROVED" && !amountOk) {
    console.error(`Valor divergente no pedido ${order.number}: ${payment.transaction_amount}`);
    await db.order.update({ where: { id: order.id }, data: { mpPaymentId: String(payment.id) } });
    return { ok: false, reason: "amount mismatch" };
  }

  if (order.paymentStatus === status && order.mpPaymentId === String(payment.id)) return { ok: true };

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: status, mpPaymentId: String(payment.id) } });
    if (status === "APPROVED" && order.status === "PENDING_PAYMENT") {
      await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
      await tx.orderEvent.create({ data: { orderId: order.id, status: "CONFIRMED", note: "Pagamento aprovado pelo Mercado Pago." } });
      if (order.userId) {
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: `Pagamento aprovado — ${order.number}`,
            body: "Seu pedido foi confirmado e entra na fila de preparo.",
            href: `/pedido/${order.number}?t=${order.trackingToken}`,
          },
        });
      }
    }
  });
  return { ok: true };
}

/**
 * Valida o cabeçalho x-signature do webhook (HMAC-SHA256).
 * Template: id:[data.id];request-id:[x-request-id];ts:[ts];
 */
export function verifyWebhookSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!opts.signature || !opts.dataId) return false;
  const parts = Object.fromEntries(
    opts.signature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  if (!parts.ts || !parts.v1) return false;
  let manifest = `id:${opts.dataId.toLowerCase()};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${parts.ts};`;
  const expected = createHmac("sha256", opts.secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
