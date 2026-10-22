import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { Catalog } from "@/lib/pricing";
import { ALWAYS_OPEN, type DayHours } from "@/lib/hours";
import { resolveImage } from "@/lib/media";

export const DEFAULT_HOURS: DayHours[] = [
  { day: 0, open: "11:00", close: "15:00", enabled: false },
  { day: 1, open: "10:30", close: "15:00", enabled: true },
  { day: 2, open: "10:30", close: "15:00", enabled: true },
  { day: 3, open: "10:30", close: "15:00", enabled: true },
  { day: 4, open: "10:30", close: "15:00", enabled: true },
  { day: 5, open: "10:30", close: "15:00", enabled: true },
  { day: 6, open: "11:00", close: "14:30", enabled: true },
];

export async function getSettings() {
  const settings = await db.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store", openingHours: DEFAULT_HOURS as unknown as object },
  });
  return { ...settings, hours: ALWAYS_OPEN };
}

export type StoreSettingsData = Awaited<ReturnType<typeof getSettings>>;

/** Catálogo do configurador, já no formato do motor de preços. */
export async function getCatalog(): Promise<Catalog> {
  const [sizes, ingredients, styles, rules] = await Promise.all([
    db.size.findMany({ orderBy: { sortOrder: "asc" } }),
    db.ingredient.findMany({ orderBy: [{ group: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    db.style.findMany({ orderBy: { sortOrder: "asc" } }),
    db.combinationRule.findMany(),
  ]);
  return {
    sizes,
    styles,
    rules,
    ingredients: ingredients.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      group: i.group,
      price: i.price,
      extraPrice: i.extraPrice,
      extraGrams: i.extraGrams,
      available: i.available,
      isVegetarian: i.isVegetarian,
      isVegan: i.isVegan,
      isLowCarb: i.isLowCarb,
      allergens: i.allergens,
      kcalPer100g: i.kcalPer100g,
      proteinPer100g: i.proteinPer100g,
      carbsPer100g: i.carbsPer100g,
      fatPer100g: i.fatPer100g,
      fiberPer100g: i.fiberPer100g,
      sodiumMgPer100g: i.sodiumMgPer100g,
    })),
  };
}

export async function getActiveSizes() {
  return db.size.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

const productInclude = {
  category: { select: { slug: true, name: true, isCombo: true } },
  reviews: { where: { approved: true }, select: { rating: true } },
} as const;

export async function listProducts(where: Prisma.ProductWhereInput = {}) {
  const products = await db.product.findMany({
    where: { active: true, category: { active: true }, ...where },
    include: productInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return products.map((p) => withMedia(withRating(p), "produtos"));
}

/** Foto do painel ou do arquivo por convenção (public/images/<pasta>/<slug>.webp) + blur. */
function withMedia<T extends { image: string | null; slug: string }>(item: T, folder: string) {
  const { src, blur } = resolveImage(item.image, folder, item.slug);
  return { ...item, image: src, imageBlur: blur };
}

function withRating<T extends { reviews: { rating: number }[] }>(p: T) {
  const count = p.reviews.length;
  const avg = count ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { ...p, rating: { count, avg: Math.round(avg * 10) / 10 } };
}

export type ProductCardData = Awaited<ReturnType<typeof listProducts>>[number];

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      ...productInclude,
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });
  if (!product || !product.active) return null;
  return withMedia(withRating(product), "produtos");
}

export async function listCategories() {
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return categories.map((c) => withMedia(c, "categorias"));
}
