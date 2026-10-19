export function shortCategoryName(name: string) {
  const s = name.replace(/^Marmitas\s+/i, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

/** Aceita apenas caminhos internos como destino de redirecionamento (evita open redirect). */
export function safeRedirectPath(value: unknown, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}
