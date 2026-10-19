import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
import { getAccessibleOrder } from "@/server/order-access";
import { createPreference, isMercadoPagoConfigured } from "@/server/mercadopago";

/** Gera um novo link de pagamento para um pedido ainda não pago. */
export async function POST(req: Request, ctx: RouteContext<"/api/orders/[number]/pay">) {
  if (!(await assertSameOrigin())) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const { number } = await ctx.params;
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  const order = await getAccessibleOrder(number, token);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT" || order.paymentMethod === "ON_DELIVERY") {
    return NextResponse.json({ error: "Este pedido não aguarda pagamento online." }, { status: 409 });
  }
  if (!isMercadoPagoConfigured()) return NextResponse.json({ error: "Pagamento online indisponível." }, { status: 503 });
  try {
    const pref = await createPreference(order, order.items, order.paymentMethod as "PIX" | "CARD");
    await db.order.update({ where: { id: order.id }, data: { mpPreferenceId: pref.id } });
    return NextResponse.json({ paymentUrl: pref.initPoint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Não foi possível abrir o pagamento agora." }, { status: 502 });
  }
}
