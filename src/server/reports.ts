import "server-only";
import { db } from "@/lib/db";
import { localParts } from "@/lib/hours";

/** Pedidos que contam como faturamento: não cancelados e com pagamento resolvido. */
export const REVENUE_WHERE = {
  status: { notIn: ["CANCELED", "PENDING_PAYMENT"] as ("CANCELED" | "PENDING_PAYMENT")[] },
};

export async function revenueByDay(from: Date, to: Date) {
  const orders = await db.order.findMany({
    where: { ...REVENUE_WHERE, createdAt: { gte: from, lte: to } },
    select: { total: true, createdAt: true },
  });
  const map = new Map<string, { revenue: number; orders: number }>();
  for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) {
    map.set(localParts(new Date(t)).ymd, { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = localParts(o.createdAt).ymd;
    const v = map.get(key) ?? { revenue: 0, orders: 0 };
    v.revenue += o.total;
    v.orders += 1;
    map.set(key, v);
  }
  return [...map.entries()].map(([day, v]) => ({ day, ...v }));
}

export async function topProducts(from: Date, to: Date, take = 10) {
  const items = await db.orderItem.groupBy({
    by: ["name"],
    where: { order: { ...REVENUE_WHERE, createdAt: { gte: from, lte: to } } },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take,
  });
  return items.map((i) => ({ name: i.name, quantity: i._sum.quantity ?? 0, total: i._sum.total ?? 0 }));
}

export async function summary(from: Date, to: Date) {
  const [agg, byPayment, byFulfillment, canceled] = await Promise.all([
    db.order.aggregate({
      where: { ...REVENUE_WHERE, createdAt: { gte: from, lte: to } },
      _sum: { total: true, discount: true, deliveryFee: true, pointsDiscount: true },
      _count: true,
    }),
    db.order.groupBy({ by: ["paymentMethod"], where: { ...REVENUE_WHERE, createdAt: { gte: from, lte: to } }, _sum: { total: true }, _count: true }),
    db.order.groupBy({ by: ["fulfillment"], where: { ...REVENUE_WHERE, createdAt: { gte: from, lte: to } }, _count: true }),
    db.order.count({ where: { status: "CANCELED", createdAt: { gte: from, lte: to } } }),
  ]);
  const revenue = agg._sum.total ?? 0;
  return {
    revenue,
    orders: agg._count,
    avgTicket: agg._count ? Math.round(revenue / agg._count) : 0,
    discounts: (agg._sum.discount ?? 0) + (agg._sum.pointsDiscount ?? 0),
    deliveryFees: agg._sum.deliveryFee ?? 0,
    canceled,
    byPayment: byPayment.map((p) => ({ method: p.paymentMethod, total: p._sum.total ?? 0, count: p._count })),
    byFulfillment: byFulfillment.map((f) => ({ fulfillment: f.fulfillment, count: f._count })),
  };
}

/** Início do dia (00:00 em São Paulo) N dias atrás. */
export function startOfLocalDay(daysAgo = 0) {
  const now = new Date();
  const { ymd } = localParts(new Date(now.getTime() - daysAgo * 86_400_000));
  return new Date(`${ymd}T00:00:00-03:00`);
}
