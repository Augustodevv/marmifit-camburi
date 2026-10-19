import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validators";
import { getSession } from "@/lib/auth";
import { assertSameOrigin, clientIp, rateLimit } from "@/lib/security";
import { CheckoutError, createOrder } from "@/server/orders";

export async function POST(req: Request) {
  if (!(await assertSameOrigin())) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  if (!rateLimit(`order:${await clientIp()}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confira os dados do pedido.", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    );
  }
  const session = await getSession();
  try {
    const { order, paymentUrl } = await createOrder(parsed.data, session?.sub ?? null);
    return NextResponse.json({ number: order.number, token: order.trackingToken, paymentUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, details: err.details ?? [] }, { status: 422 });
    }
    console.error("Erro ao criar pedido", err);
    return NextResponse.json({ error: "Erro inesperado ao criar o pedido. Tente novamente." }, { status: 500 });
  }
}
