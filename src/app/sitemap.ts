import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const products = await db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/cardapio", "/monte-sua-marmita", "/marmitas-do-dia", "/combos-e-promocoes", "/sobre", "/contato"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8 })),
    ...products.map((p) => ({ url: `${base}/cardapio/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
  ];
}
