import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/hours";

function cell(v: string | number | null | undefined) {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita injeção de fórmula no Excel
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const re = /^\d{4}-\d{2}-\d{2}$/;
  const de = req.nextUrl.searchParams.get("de") ?? "";
  const ate = req.nextUrl.searchParams.get("ate") ?? "";
  if (!re.test(de) || !re.test(ate)) return NextResponse.json({ error: "Período inválido." }, { status: 400 });
  const orders = await db.order.findMany({
    where: { createdAt: { gte: new Date(`${de}T00:00:00-03:00`), lte: new Date(`${ate}T23:59:59-03:00`) } },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  });
  const header = ["Pedido", "Data", "Status", "Cliente", "Modalidade", "Pagamento", "Status pagamento", "Itens", "Subtotal", "Entrega", "Desconto", "Total", "Cupom"];
  const brl = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const rows = orders.map((o) =>
    [
      o.number,
      formatDateTime(o.createdAt),
      ORDER_STATUS_LABEL[o.status],
      o.customerName,
      o.fulfillment === "PICKUP" ? "Retirada" : "Entrega",
      PAYMENT_METHOD_LABEL[o.paymentMethod],
      PAYMENT_STATUS_LABEL[o.paymentStatus],
      o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
      brl(o.subtotal),
      brl(o.deliveryFee),
      brl(o.discount + o.pointsDiscount),
      brl(o.total),
      o.couponCode,
    ]
      .map(cell)
      .join(";"),
  );
  const csv = "﻿" + [header.map(cell).join(";"), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos_${de}_${ate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
