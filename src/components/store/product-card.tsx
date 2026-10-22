import Link from "next/link";
import { Star } from "lucide-react";
import { FoodImage } from "@/components/store/food-image";
import { QuickAdd } from "@/components/store/quick-add";
import { formatBRL, productPrice } from "@/lib/pricing";
import { WEEKDAYS } from "@/lib/hours";
import { BADGE_LABEL, productBadges } from "@/lib/badges";
import type { ProductCardData } from "@/server/catalog";

export interface CardSize {
  id: string;
  name: string;
  grams: number;
  priceMultiplier: number;
}

export function ProductCard({
  product,
  defaultSize,
}: {
  product: ProductCardData;
  defaultSize: CardSize | null;
}) {
  const price = productPrice(product, product.hasSizes ? defaultSize : null);
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round((1 - product.basePrice / product.compareAtPrice) * 100)
      : 0;
  const badges = productBadges(product);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-cream-300/80 bg-white shadow-soft transition duration-500 hover:-translate-y-1 hover:border-tangerine/50 hover:shadow-float">
      <Link href={`/cardapio/${product.slug}`} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        <FoodImage
          src={product.image}
          alt={product.name}
          seed={product.slug}
          blurDataURL={product.imageBlur}
          className="aspect-[4/3] w-full"
          imgClassName="transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-tangerine px-2.5 py-1 text-xs font-bold text-forest shadow-soft">-{discount}%</span>
          )}
          {product.dailyDays.length > 0 && (
            <span className="rounded-full bg-cream/95 px-2.5 py-1 text-xs font-semibold text-forest shadow-soft">
              {product.dailyDays.map((d) => WEEKDAYS[d]).join(" · ")}
            </span>
          )}
          {!product.available && (
            <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-cream">Esgotado</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-leaf-700">{product.category.name}</p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-forest">
          <Link href={`/cardapio/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {product.name}
          </Link>
        </h3>
        {badges.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Características">
            {badges.map((b) => (
              <li key={b} className="rounded-full bg-leaf-100 px-2 py-0.5 text-[11px] font-semibold text-leaf-700">
                {BADGE_LABEL[b]}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        {product.rating.count > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-forest">
            <Star className="size-3.5 fill-tangerine text-tangerine" aria-hidden />
            <span className="font-semibold">{product.rating.avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.rating.count} avaliações verificadas)</span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div>
            {product.hasSizes && defaultSize && (
              <p className="text-xs text-muted-foreground">
                {defaultSize.name} · {defaultSize.grams} g
              </p>
            )}
            <p className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-forest">{formatBRL(price)}</span>
              {product.compareAtPrice && discount > 0 && (
                <s className="text-sm text-muted-foreground">{formatBRL(product.compareAtPrice)}</s>
              )}
            </p>
          </div>
          {product.available && (
            <QuickAdd
              line={{
                type: "product",
                productId: product.id,
                sizeId: product.hasSizes ? (defaultSize?.id ?? null) : null,
                slug: product.slug,
                name: product.name,
                image: product.image,
                sizeLabel: product.hasSizes && defaultSize ? `${defaultSize.name} (${defaultSize.grams} g)` : null,
                unitPrice: price,
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}
