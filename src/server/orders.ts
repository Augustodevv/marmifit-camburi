import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getCatalog, getSettings } from "@/server/catalog";
import {
  couponDiscount,
  deliveryFeeFor,
  pointsRedemption,
  productPrice,
  quoteCustom,
  type CustomConfig,
} from "@/lib/pricing";
import { localParts, validateSchedule } from "@/lib/hours";
import type { CartItemInput, CheckoutInput, CheckoutQuoteInput } from "@/lib/validators";
import { WEEKDAYS } from "@/lib/hours";
import { ORDER_STATUS_LABEL, STATUS_FLOW, type OrderStatusKey } from "@/lib/constants";
import { createPreference, isMercadoPagoConfigured } from "@/server/mercadopago";

export interface QuotedLine {
  index: number;
  name: string;
  sizeName: string | null;
  description: string | null;
  productId: string | null;
  configuration: CustomConfig | { productId: string; sizeId: string | null } ;
  unitPrice: number;
  quantity: number;
  total: number;
  notes: string | null;
  error: string | null;
}

/** Recalcula cada item do carrinho a partir do banco. Nunca confia no preço do cliente. */
export async function quoteItems(items: CartItemInput[], forDate: Date = new Date()) {
  const catalog = await getCatalog();
  const productIds = items.filter((i) => i.type === "product").map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { category: { select: { active: true } } },
  });
  const day = localParts(forDate).day;

  const lines: QuotedLine[] = items.map((item, index) => {
    if (item.type === "custom") {
      const q = quoteCustom(catalog, item.config);
      const size = catalog.sizes.find((s) => s.id === item.config.sizeId);
      return {
        index,
        name: "Marmita personalizada",
        sizeName: size ? `${size.name} (${size.grams} g)` : null,
        description: q.description,
        productId: null,
        configuration: item.config,
        unitPrice: q.unitPrice,
        quantity: item.quantity,
        total: q.unitPrice * item.quantity,
        notes: item.config.notes || null,
        error: q.ok ? null : q.errors.join(" "),
      };
    }
    const product = products.find((p) => p.id === item.productId);
    const size = item.sizeId ? catalog.sizes.find((s) => s.id === item.sizeId) : undefined;
    let error: string | null = null;
    if (!product || !product.active || !product.category.active) error = "Produto não encontrado.";
    else if (!product.available) error = `${product.name} está esgotado no momento.`;
    else if (product.dailyDays.length > 0 && !product.dailyDays.includes(day)) {
      error = `${product.name} é servido apenas: ${product.dailyDays.map((d) => WEEKDAYS[d]).join(", ")}.`;
    } else if (product.hasSizes && (!size || !size.active)) error = "Escolha um tamanho disponível.";
    const unitPrice = product ? productPrice(product, product.hasSizes ? size : null) : 0;
    return {
      index,
      name: product?.name ?? "Produto indisponível",
      sizeName: product?.hasSizes && size ? `${size.name} (${size.grams} g)` : null,
      description: null,
      productId: product?.id ?? null,
      configuration: { productId: item.productId, sizeId: item.sizeId ?? null },
      unitPrice,
      quantity: item.quantity,
      total: unitPrice * item.quantity,
      notes: item.notes || null,
      error,
    };
  });

  return { lines, subtotal: lines.reduce((s, l) => s + l.total, 0) };
}

export async function findZone(district: string | undefined) {
  if (!district) return null;
  const zones = await db.deliveryZone.findMany({ where: { active: true } });
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  return zones.find((z) => norm(z.district) === norm(district)) ?? null;
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

/** Calcula o pedido completo sem gravar (usado no checkout para mostrar o total). */
export async function quoteCheckout(input: CheckoutQuoteInput, userId: string | null) {
  const settings = await getSettings();
  const now = new Date();
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const { lines, subtotal } = await quoteItems(input.items, scheduledFor ?? now);
  const problems: string[] = lines.filter((l) => l.error).map((l) => `${l.name}: ${l.error}`);

  if (!settings.acceptingOrders) problems.push("A loja não está aceitando pedidos no momento.");
  const scheduleError = validateSchedule({
    hours: settings.hours,
    now,
    scheduledFor,
    prepTimeMinutes: settings.prepTimeMinutes,
    maxScheduleDays: settings.maxScheduleDays,
  });
  if (scheduleError) problems.push(scheduleError);
  if (subtotal < settings.minOrder) problems.push(`Pedido mínimo de R$ ${(settings.minOrder / 100).toFixed(2)}.`);

  let zone = null;
  if (input.fulfillment === "DELIVERY") {
    zone = await findZone(input.address?.district);
    if (!zone) problems.push("Ainda não entregamos neste bairro. Escolha retirada ou outro endereço.");
  }
  const deliveryFee = deliveryFeeFor(input.fulfillment, zone?.fee ?? null, subtotal, settings.freeDeliveryMin);

  let discount = 0;
  let couponError: string | undefined;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon) couponError = "Cupom não encontrado.";
    else {
      const r = couponDiscount(coupon, subtotal, now);
      discount = r.discount;
      couponError = r.error;
      if (!r.error) couponCode = coupon.code;
    }
  }

  let points = { pointsUsed: 0, discount: 0 };
  let userPoints = 0;
  if (userId && input.usePoints) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
    userPoints = user?.loyaltyPoints ?? 0;
    points = pointsRedemption(userPoints, true, settings, subtotal - discount);
  }

  if ((input.paymentMethod === "PIX" || input.paymentMethod === "CARD") && !isMercadoPagoConfigured()) {
    problems.push("Pagamento online indisponível no momento. Escolha pagar na entrega/retirada.");
  }

  const total = Math.max(0, subtotal - discount - points.discount) + deliveryFee;
  return {
    settings,
    lines,
    subtotal,
    deliveryFee,
    discount,
    couponCode,
    couponError,
    pointsUsed: points.pointsUsed,
    pointsDiscount: points.discount,
    total,
    zone,
    scheduledFor,
    problems,
  };
}

function trackingToken() {
  return randomBytes(18).toString("base64url");
}

export async function createOrder(input: CheckoutInput, userId: string | null) {
  const q = await quoteCheckout(input, userId);
  if (q.couponError) q.problems.push(q.couponError);
  if (q.problems.length) throw new CheckoutError("Não foi possível finalizar o pedido.", q.problems);

  const online = input.paymentMethod !== "ON_DELIVERY";
  const pointsEarned = Math.floor(q.total / 100) * q.settings.pointsPerReal;

  const order = await db.$transaction(async (tx) => {
    if (q.couponCode) {
      const coupon = await tx.coupon.findUniqueOrThrow({ where: { code: q.couponCode } });
      const updated = await tx.coupon.updateMany({
        where: { id: coupon.id, ...(coupon.maxUses != null ? { usedCount: { lt: coupon.maxUses } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (updated.count === 0) throw new CheckoutError("Cupom esgotado.");
    }
    if (userId && q.pointsUsed > 0) {
      const updated = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { gte: q.pointsUsed } },
        data: { loyaltyPoints: { decrement: q.pointsUsed } },
      });
      if (updated.count === 0) throw new CheckoutError("Pontos insuficientes.");
    }

    const initialStatus: OrderStatusKey = online ? "PENDING_PAYMENT" : "CONFIRMED";
    const created = await tx.order.create({
      data: {
        number: `TMP-${trackingToken()}`,
        trackingToken: trackingToken(),
        userId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        status: initialStatus,
        fulfillment: input.fulfillment,
        address: input.fulfillment === "DELIVERY" && input.address ? { ...input.address } : undefined,
        scheduledFor: q.scheduledFor,
        subtotal: q.subtotal,
        deliveryFee: q.deliveryFee,
        discount: q.discount,
        pointsDiscount: q.pointsDiscount,
        pointsUsed: q.pointsUsed,
        pointsEarned,
        total: q.total,
        couponCode: q.couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: online ? "PENDING" : "NOT_REQUIRED",
        notes: input.notes || null,
        items: {
          create: q.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            sizeName: l.sizeName,
            description: l.description,
            configuration: l.configuration as object,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            total: l.total,
            notes: l.notes,
          })),
        },
        events: { create: { status: initialStatus, note: online ? "Pedido criado, aguardando pagamento." : "Pedido recebido." } },
      },
    });
    return tx.order.update({
      where: { id: created.id },
      data: { number: `MF${String(created.seq).padStart(5, "0")}` },
    });
  });

  if (userId && input.saveAddress && input.address && input.fulfillment === "DELIVERY") {
    const count = await db.address.count({ where: { userId } });
    await db.address.create({ data: { ...input.address, userId, label: input.address.label || "Casa", isDefault: count === 0 } });
  }
  if (userId) {
    await db.notification.create({
      data: {
        userId,
        title: `Pedido ${order.number} recebido`,
        body: online ? "Assim que o pagamento for confirmado começamos o preparo." : "Já estamos cuidando do seu pedido.",
        href: `/pedido/${order.number}?t=${order.trackingToken}`,
      },
    });
  }

  let paymentUrl: string | null = null;
  if (online) {
    try {
      const pref = await createPreference(order, q.lines, input.paymentMethod as "PIX" | "CARD");
      await db.order.update({ where: { id: order.id }, data: { mpPreferenceId: pref.id } });
      paymentUrl = pref.initPoint;
    } catch (err) {
      console.error("Falha ao criar preferência no Mercado Pago", err);
      throw new CheckoutError(
        `Pedido ${order.number} criado, mas não conseguimos abrir o pagamento. Tente novamente pela página do pedido.`,
      );
    }
  }

  return { order, paymentUrl };
}

/** Atualiza status com validação de fluxo, notificações e pontos de fidelidade. */
export async function changeOrderStatus(orderId: string, next: OrderStatusKey, note?: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const allowed = STATUS_FLOW[order.status as OrderStatusKey];
  if (!allowed.includes(next)) {
    throw new Error(`Não é possível mudar de "${ORDER_STATUS_LABEL[order.status]}" para "${ORDER_STATUS_LABEL[next]}".`);
  }
  if (next === "OUT_FOR_DELIVERY" && order.fulfillment !== "DELIVERY") throw new Error("Pedido é para retirada.");
  if (next === "READY_FOR_PICKUP" && order.fulfillment !== "PICKUP") throw new Error("Pedido é para entrega.");
  if (order.status === "PENDING_PAYMENT" && next === "CONFIRMED" && order.paymentStatus !== "APPROVED") {
    throw new Error("O pagamento online ainda não foi aprovado pelo Mercado Pago.");
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: next } });
    await tx.orderEvent.create({ data: { orderId, status: next, note: note || null } });
    if (order.userId) {
      if (next === "DELIVERED" && order.pointsEarned > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: order.pointsEarned } } });
      }
      if (next === "CANCELED" && order.pointsUsed > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: order.pointsUsed } } });
      }
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Pedido ${order.number}: ${ORDER_STATUS_LABEL[next]}`,
          body:
            next === "DELIVERED" && order.pointsEarned > 0
              ? `Bom apetite! Você ganhou ${order.pointsEarned} pontos.`
              : note || "Acompanhe os detalhes na página do pedido.",
          href: `/pedido/${order.number}?t=${order.trackingToken}`,
        },
      });
    }
  });
}
