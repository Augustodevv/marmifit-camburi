import "server-only";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Busca um pedido para exibição pública. Acesso permitido com o token do link,
 * para o dono logado ou para a equipe. Evita expor dados pessoais por número sequencial.
 */
export async function getAccessibleOrder(number: string, token: string | undefined) {
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  if (token && sameToken(token, order.trackingToken)) return order;
  const session = await getSession();
  if (session && (session.sub === order.userId || session.role === "ADMIN" || session.role === "STAFF")) return order;
  return null;
}
