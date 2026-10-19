import { NextResponse } from "next/server";
import { z } from "zod";
import { cartItemSchema } from "@/lib/validators";
import { quoteItems } from "@/server/orders";

const bodySchema = z.object({ items: z.array(cartItemSchema).max(40) });

/** Recalcula preços e disponibilidade do carrinho a partir do banco. */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Carrinho inválido." }, { status: 400 });
  const { lines, subtotal } = await quoteItems(parsed.data.items);
  return NextResponse.json({
    subtotal,
    lines: lines.map((l) => ({ index: l.index, unitPrice: l.unitPrice, error: l.error, name: l.name })),
  });
}
