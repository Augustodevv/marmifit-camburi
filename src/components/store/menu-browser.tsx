"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard, type CardSize } from "@/components/store/product-card";
import { shortCategoryName } from "@/lib/format";
import { productPrice } from "@/lib/pricing";
import { todayDailyIndex } from "@/lib/hours";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/server/catalog";

const FILTERS = [
  { id: "sem-gluten", label: "Sem glúten", test: (p: ProductCardData) => !p.allergens.includes("Glúten") },
  { id: "sem-lactose", label: "Sem leite", test: (p: ProductCardData) => !p.allergens.includes("Leite") },
  { id: "sem-peixe", label: "Sem peixe", test: (p: ProductCardData) => !p.allergens.includes("Peixe") },
  { id: "promocao", label: "Em promoção", test: (p: ProductCardData) => !!p.compareAtPrice && p.compareAtPrice > p.basePrice },
  { id: "hoje", label: "Disponível hoje", test: (p: ProductCardData) => p.available && (p.dailyDays.length === 0 || p.dailyDays.includes(todayDailyIndex())) },
] as const;

type Sort = "relevancia" | "menor" | "maior" | "avaliacao";

export function MenuBrowser({
  categories,
  products,
  defaultSize,
  initialCategory,
}: {
  categories: { slug: string; name: string }[];
  products: ProductCardData[];
  defaultSize: CardSize | null;
  initialCategory: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("relevancia");

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category !== "todas" && p.category.slug !== category) return false;
      if (term && !`${p.name} ${p.description} ${p.ingredientsText ?? ""} ${p.tags.join(" ")}`.toLowerCase().includes(term)) return false;
      return active.every((id) => FILTERS.find((f) => f.id === id)!.test(p));
    });
    const price = (p: ProductCardData) => productPrice(p, p.hasSizes ? defaultSize : null);
    if (sort === "menor") list = [...list].sort((a, b) => price(a) - price(b));
    if (sort === "maior") list = [...list].sort((a, b) => price(b) - price(a));
    if (sort === "avaliacao") list = [...list].sort((a, b) => b.rating.avg - a.rating.avg);
    return list;
  }, [products, category, q, active, sort, defaultSize]);

  const toggle = (id: string) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const tabs = [{ slug: "todas", name: "Todas" }, ...categories];

  return (
    <div className="container-page py-10">
      {/* fixa só a partir do tablet: no celular a barra ocuparia metade da tela */}
      <div className="-mx-4 border-b border-cream-300/70 bg-cream/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-card sm:border sm:px-4 md:sticky md:top-20 md:z-30 lg:top-[84px]">
        <div role="tablist" aria-label="Categorias" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tabs.map((c) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={category === c.slug}
              onClick={() => setCategory(c.slug)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                category === c.slug ? "text-cream" : "bg-white text-forest hover:bg-cream-200",
              )}
            >
              {category === c.slug && (
                <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
              )}
              <span className="relative">{c.slug === "todas" ? c.name : shortCategoryName(c.name)}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar no cardápio</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar prato ou ingrediente"
              className="h-11 w-full rounded-xl border border-input bg-white pl-10 pr-10 text-sm outline-none transition focus:border-leaf focus:ring-3 focus:ring-leaf/20"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-cream-200" aria-label="Limpar busca">
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                aria-pressed={active.includes(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active.includes(f.id) ? "border-leaf-700 bg-leaf-700 text-white" : "border-cream-300 bg-white text-forest hover:border-leaf",
                )}
              >
                {f.label}
              </button>
            ))}
            <label className="ml-auto lg:ml-2">
              <span className="sr-only">Ordenar</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 rounded-lg border border-input bg-white px-2 text-xs font-semibold text-forest"
              >
                <option value="relevancia">Relevância</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="avaliacao">Melhor avaliadas</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <h2 className="sr-only">Pratos</h2>
      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {visible.length} {visible.length === 1 ? "opção encontrada" : "opções encontradas"}
      </p>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-cream-300 bg-white p-12 text-center">
          <p className="font-display text-2xl text-forest">Nada por aqui com esses filtros.</p>
          <p className="mt-2 text-muted-foreground">Limpe os filtros ou monte a sua do jeito que quiser.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setActive([]); setQ(""); setCategory("todas"); }} className="rounded-xl border border-cream-300 px-4 py-2 text-sm font-semibold">
              Limpar filtros
            </button>
            <Link href="/monte-sua-marmita" className="inline-flex items-center gap-2 rounded-xl bg-tangerine px-4 py-2 text-sm font-semibold text-forest">
              <Sparkles className="size-4" /> Montar a minha
            </Link>
          </div>
        </div>
      ) : (
        <motion.div layout className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
                <ProductCard product={p} defaultSize={defaultSize} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
