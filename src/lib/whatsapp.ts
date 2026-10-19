/** Links do WhatsApp (wa.me) — não exigem API nem credenciais. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function orderWhatsappText(order: {
  number: string;
  customerName: string;
  total: number;
  fulfillment: string;
  items: { quantity: number; name: string; sizeName?: string | null }[];
  trackingUrl: string;
}): string {
  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const lines = order.items.map((i) => `• ${i.quantity}x ${i.name}${i.sizeName ? ` (${i.sizeName})` : ""}`);
  return [
    `Olá! Sou ${order.customerName} e acabei de fazer o pedido *${order.number}*.`,
    ...lines,
    `Total: ${brl(order.total)} — ${order.fulfillment === "PICKUP" ? "Retirada" : "Entrega"}`,
    `Acompanhar: ${order.trackingUrl}`,
  ].join("\n");
}
