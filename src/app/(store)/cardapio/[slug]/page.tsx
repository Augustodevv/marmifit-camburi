import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShieldAlert, Star, BadgeCheck } from "lucide-react";
import { FoodImage } from "@/components/store/food-image";
import { ProductPurchase } from "@/components/store/product-purchase";
import { NutritionTable } from "@/components/store/nutrition-table";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { db } from "@/lib/db";
import { formatBRL, productPrice } from "@/lib/pricing";
import { todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { getProductBySlug, listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";

export async function generateMetadata({ params }: PageProps<"/cardapio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, description: true, image: true } });
  if (!product) return { title: "Prato não encontrado" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/cardapio/${slug}` },
    openGraph: { title: product.name, description: product.description, images: product.image ? [product.image] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/cardapio/[slug]">) {
  const { slug } = await params;
  const [product, ctx] = await Promise.all([getProductBySlug(slug), getListingContext()]);
  if (!product) notFound();

  const related = await listProducts({ id: { not: product.id }, OR: [{ categoryId: product.categoryId }, { featured: true }], dailyDays: { isEmpty: true } });

  const today = todayDailyIndex();
  const blockedReason = product.available ? null : "Esgotado no momento. Volte mais tarde ou veja outras opções.";
  const notice =
    product.dailyDays.length > 0 && !product.dailyDays.includes(today)
      ? `Prato servido apenas: ${product.dailyDays.map((d) => WEEKDAYS[d].toLowerCase()).join(", ")}. No checkout, agende a entrega para esse dia.`
      : null;

  const nutrition =
    product.kcal != null && product.proteinG != null && product.carbsG != null && product.fatG != null && product.fiberG != null && product.sodiumMg != null
      ? { kcal: product.kcal, protein: product.proteinG, carbs: product.carbsG, fat: product.fatG, fiber: product.fiberG, sodiumMg: product.sodiumMg }
      : null;

  const price = productPrice(product, product.hasSizes ? ctx.defaultSize : null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image ? { image: product.image } : {}),
    category: product.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (price / 100).toFixed(2),
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.avg, reviewCount: product.rating.count } }
      : {}),
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/cardapio" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:text-leaf-700">
        <ChevronLeft className="size-4" aria-hidden /> Voltar ao cardápio
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="relative">
          <FoodImage
            src={product.image}
            alt={product.name}
            seed={product.slug}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-square w-full rounded-panel shadow-lift"
          />
        </div>

        <div>
          <Link href={`/cardapio?categoria=${product.category.slug}`} className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">
            {product.category.name}
          </Link>
          <h1 className="mt-2 text-4xl font-semibold text-forest sm:text-5xl">{product.name}</h1>
          {product.rating.count > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm">
              <Star className="size-4 fill-tangerine text-tangerine" aria-hidden />
              <strong>{product.rating.avg.toFixed(1)}</strong>
              <span className="text-muted-foreground">· {product.rating.count} avaliações verificadas</span>
            </p>
          )}
          <p className="mt-4 text-lg leading-relaxed text-ink/75">{product.description}</p>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-forest">{product.hasSizes ? `a partir de ${formatBRL(productPrice(product, ctx.sizes[0]))}` : formatBRL(product.basePrice)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <s className="text-muted-foreground">{formatBRL(product.compareAtPrice)}</s>
            )}
          </p>

          <div className="mt-8">
            <ProductPurchase
              product={product}
              sizes={ctx.sizes}
              defaultSizeId={product.hasSizes ? (ctx.defaultSize?.id ?? null) : null}
              blockedReason={blockedReason}
              notice={notice}
            />
          </div>

          <div className="mt-10 space-y-6">
            {product.ingredientsText && (
              <section>
                <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">Ingredientes</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.ingredientsText}</p>
              </section>
            )}
            <section>
              <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-wider text-forest">
                <ShieldAlert className="size-4 text-tangerine" aria-hidden /> Alergênicos
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {product.allergens.length ? `Contém: ${product.allergens.join(", ")}.` : "Nenhum alergênico principal cadastrado."} Preparado em cozinha que manipula glúten, leite, ovos, peixe, soja e castanhas.
              </p>
            </section>
            <section>
              <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-forest">Informação nutricional</h2>
              <div className="mt-2">
                <NutritionTable data={nutrition} source={product.nutritionSource} note={product.hasSizes ? "Valores para o tamanho Média." : undefined} />
              </div>
            </section>
          </div>
        </div>
      </div>

      <section className="mt-20" aria-labelledby="avaliacoes">
        <h2 id="avaliacoes" className="text-3xl font-semibold text-forest">Avaliações verificadas</h2>
        
        <div className="mt-6">
          <div className="space-y-4">
            {product.reviews.length === 0 && <p className="text-muted-foreground">Ainda sem avaliações. Peça e seja o primeiro!</p>}
            {product.reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-cream-300 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5" aria-label={`${r.rating} de 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-4 ${i < r.rating ? "fill-tangerine text-tangerine" : "text-cream-300"}`} aria-hidden />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-leaf-700">
                    <BadgeCheck className="size-4" aria-hidden /> Compra verificada
                  </span>
                </div>
                {r.comment && <p className="mt-3 text-forest">{r.comment}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {r.user.name.split(" ")[0]} · {r.createdAt.toLocaleDateString("pt-BR")}
                </p>
              </article>
            ))}
          </div>
          
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="Recomendações" title="Combina com você também" href="/cardapio" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} defaultSize={ctx.defaultSize} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
