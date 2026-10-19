import { NextResponse } from "next/server";
import { checkoutQuoteSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { quoteCheckout } from "@/server/orders";

/** Prévia do total (frete, cupom, pontos) sem gravar nada. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados incompletos.", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const session = await getSession();
  const q = await quoteCheckout(parsed.data, session?.sub ?? null);
  return NextResponse.json({
    subtotal: q.subtotal,
    deliveryFee: q.deliveryFee,
    discount: q.discount,
    couponCode: q.couponCode,
    couponError: q.couponError ?? null,
    pointsUsed: q.pointsUsed,
    pointsDiscount: q.pointsDiscount,
    total: q.total,
    problems: q.problems,
    etaMinutes: q.zone?.etaMinutes ?? null,
  });
}
