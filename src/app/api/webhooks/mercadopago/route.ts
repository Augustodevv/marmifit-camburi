import { NextResponse, type NextRequest } from "next/server";
import { syncPayment, verifyWebhookSignature } from "@/server/mercadopago";

/**
 * Webhook do Mercado Pago. Valida a assinatura x-signature e, em seguida,
 * consulta o pagamento direto na API (nunca confia no corpo da notificação).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const dataId = req.nextUrl.searchParams.get("data.id") ?? (body.data?.id != null ? String(body.data.id) : null);
  const valid = verifyWebhookSignature({
    signature: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
    secret,
  });
  if (!valid) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type") ?? body.type;
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const result = await syncPayment(dataId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erro ao processar webhook", err);
    return NextResponse.json({ error: "Falha temporária." }, { status: 500 });
  }
}
