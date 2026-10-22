import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Ticket } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/store/section";
import { ProductCard } from "@/components/store/product-card";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";

export const metadata: Metadata = pageMetadata({
  title: "Combos e promoções",
  description: "Combos familiares, kits para a semana e cupons de desconto da Marmifit Camburi, em São Sebastião (SP).",
  path: "/combos-e-promocoes",
});

export default async function CombosPage() {
  const now = new Date();
  const [combos, promos, coupons, ctx] = await Promise.all([
    listProducts({ category: { isCombo: true } }),
    listProducts({ compareAtPrice: { not: null }, category: { isCombo: false } }),
    db.coupon.findMany({
      where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "asc" },
    }),
    getListingContext(),
  ]);
  const availableCoupons = coupons.filter((c) => c.maxUses == null || c.usedCount < c.maxUses);
  const families = combos.filter((p) => p.category.slug === "combos-familiares");
  const weekly = combos.filter((p) => p.category.slug !== "combos-familiares");
  const card = (p: (typeof combos)[number]) => (
    <ProductCard key={p.id} product={p} defaultSize={ctx.defaultSize} />
  );

  return (
    <>
      <PageHeader eyebrow="Economize" title="Combos e promoções" description="Kits para a família e para a semana inteira, com preço especial." />
      <div className="container-page space-y-20 py-12">
        {availableCoupons.length > 0 && (
          <section aria-labelledby="cupons">
            <SectionHeading eyebrow="Cupons" title="Cupons ativos" description="Digite o código no checkout." />
            <h2 id="cupons" className="sr-only">Cupons</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableCoupons.map((c) => (
                <div key={c.id} className="relative flex items-center gap-4 overflow-hidden rounded-card border-2 border-dashed border-tangerine bg-white p-5">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-tangerine-100 text-[#a35a12]">
                    <Ticket className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-mono text-lg font-bold tracking-wider text-forest">{c.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.description ?? (c.type === "PERCENT" ? `${c.value}% de desconto` : `${formatBRL(c.value)} de desconto`)}
                    </p>
                    {c.expiresAt && <p className="text-xs text-muted-foreground">Válido até {c.expiresAt.toLocaleDateString("pt-BR")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {weekly.length > 0 && (
          <section>
            <SectionHeading eyebrow="Combos semanais" title="Semana resolvida" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{weekly.map(card)}</div>
          </section>
        )}
        {families.length > 0 && (
          <section>
            <SectionHeading eyebrow="Combos familiares" title="Para dividir" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{families.map(card)}</div>
          </section>
        )}
        {promos.length > 0 && (
          <section>
            <SectionHeading eyebrow="Promoções" title="Pratos com desconto" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{promos.map(card)}</div>
          </section>
        )}
      </div>
    </>
  );
}
