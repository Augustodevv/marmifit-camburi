/**
 * Motor de preço e validação de marmitas. Código puro (sem acesso ao banco),
 * usado no navegador para preço instantâneo e no servidor como fonte de verdade.
 * Valores em centavos.
 */

export type IngredientGroup = "PROTEIN" | "BASE" | "SIDE" | "ADDON";

export interface PricingSize {
  id: string;
  slug: string;
  name: string;
  grams: number;
  customBasePrice: number;
  priceMultiplier: number;
  maxProteins: number;
  maxBases: number;
  maxSides: number;
  maxAddons: number;
  proteinGrams: number;
  baseGrams: number;
  sidesGrams: number;
  active: boolean;
}

export interface PricingIngredient {
  id: string;
  slug: string;
  name: string;
  group: IngredientGroup;
  price: number;
  extraPrice: number | null;
  extraGrams: number | null;
  available: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isLowCarb: boolean;
  allergens: string[];
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  sodiumMgPer100g: number | null;
}

export interface PricingStyle {
  id: string;
  slug: string;
  name: string;
  requireVegetarian: boolean;
  requireVegan: boolean;
  requireLowCarb: boolean;
  active: boolean;
}

export interface PricingRule {
  id: string;
  description: string;
  ingredientId: string;
  conflictIngredientId: string | null;
  sizeId: string | null;
  active: boolean;
}

export interface Catalog {
  sizes: PricingSize[];
  ingredients: PricingIngredient[];
  styles: PricingStyle[];
  rules: PricingRule[];
}

export interface CustomConfig {
  styleId: string;
  sizeId: string;
  proteinIds: string[];
  extraProteinIds: string[];
  baseIds: string[];
  sideIds: string[];
  addonIds: string[];
  notes?: string;
}

export interface Nutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodiumMg: number;
  grams: number;
}

export interface CustomQuote {
  ok: boolean;
  errors: string[];
  unitPrice: number;
  breakdown: { label: string; amount: number }[];
  nutrition: Nutrition | null;
  allergens: string[];
  description: string;
}

const GROUP_LABEL: Record<IngredientGroup, string> = {
  PROTEIN: "proteína",
  BASE: "base",
  SIDE: "acompanhamento",
  ADDON: "adicional",
};

/** Arredonda para múltiplos de 10 centavos. */
export function roundPrice(cents: number): number {
  return Math.round(cents / 10) * 10;
}

/** Preço de um produto pronto em um tamanho. */
export function productPrice(
  product: { basePrice: number; hasSizes: boolean },
  size?: Pick<PricingSize, "priceMultiplier"> | null,
): number {
  if (!product.hasSizes || !size) return product.basePrice;
  return roundPrice((product.basePrice * size.priceMultiplier) / 10000);
}

/** Verifica se um ingrediente é compatível com o estilo escolhido. */
export function ingredientFitsStyle(ing: PricingIngredient, style: PricingStyle | undefined): boolean {
  if (!style) return true;
  if (style.requireVegan && !ing.isVegan) return false;
  if (style.requireVegetarian && !(ing.isVegetarian || ing.isVegan)) return false;
  if (style.requireLowCarb && (ing.group === "BASE" || ing.group === "SIDE") && !ing.isLowCarb) return false;
  return true;
}

/**
 * Motivo pelo qual um ingrediente não pode ser escolhido no contexto atual,
 * ou null se pode. Usado pela interface para desabilitar cards.
 */
export function ingredientBlockReason(
  catalog: Catalog,
  config: CustomConfig,
  ing: PricingIngredient,
): string | null {
  if (!ing.available) return "Indisponível hoje";
  const style = catalog.styles.find((s) => s.id === config.styleId);
  if (!ingredientFitsStyle(ing, style)) return `Não combina com o estilo ${style?.name}`;
  const selected = new Set(allSelectedIds(config));
  for (const rule of catalog.rules) {
    if (!rule.active) continue;
    const involves = rule.ingredientId === ing.id || rule.conflictIngredientId === ing.id;
    if (!involves) continue;
    if (rule.ingredientId === ing.id && rule.sizeId && rule.sizeId === config.sizeId) return rule.description;
    const other = rule.ingredientId === ing.id ? rule.conflictIngredientId : rule.ingredientId;
    if (other && selected.has(other) && !selected.has(ing.id)) return rule.description;
  }
  return null;
}

export function allSelectedIds(config: CustomConfig): string[] {
  return [...config.proteinIds, ...config.baseIds, ...config.sideIds, ...config.addonIds];
}

function limitFor(size: PricingSize, group: IngredientGroup): number {
  switch (group) {
    case "PROTEIN":
      return size.maxProteins;
    case "BASE":
      return size.maxBases;
    case "SIDE":
      return size.maxSides;
    case "ADDON":
      return size.maxAddons;
  }
}

export function groupLimit(size: PricingSize | undefined, group: IngredientGroup): number {
  return size ? limitFor(size, group) : 0;
}

function hasNutrition(i: PricingIngredient): boolean {
  return (
    i.kcalPer100g != null &&
    i.proteinPer100g != null &&
    i.carbsPer100g != null &&
    i.fatPer100g != null &&
    i.fiberPer100g != null &&
    i.sodiumMgPer100g != null
  );
}

/**
 * Valida e precifica uma marmita personalizada.
 * A nutrição só é calculada quando TODOS os itens têm dados cadastrados
 * (e gramagem definida); caso contrário retorna null — nunca estimamos.
 */
export function quoteCustom(catalog: Catalog, config: CustomConfig): CustomQuote {
  const errors: string[] = [];
  const breakdown: { label: string; amount: number }[] = [];
  const byId = new Map(catalog.ingredients.map((i) => [i.id, i]));

  const size = catalog.sizes.find((s) => s.id === config.sizeId && s.active);
  const style = catalog.styles.find((s) => s.id === config.styleId && s.active);
  if (!size) errors.push("Escolha um tamanho disponível.");
  if (!style) errors.push("Escolha um estilo disponível.");

  const groups: [IngredientGroup, string[]][] = [
    ["PROTEIN", config.proteinIds],
    ["BASE", config.baseIds],
    ["SIDE", config.sideIds],
    ["ADDON", config.addonIds],
  ];

  const all = allSelectedIds(config);
  if (new Set(all).size !== all.length) errors.push("Há itens repetidos na marmita.");

  const picked: Record<IngredientGroup, PricingIngredient[]> = { PROTEIN: [], BASE: [], SIDE: [], ADDON: [] };

  for (const [group, ids] of groups) {
    for (const id of ids) {
      const ing = byId.get(id);
      if (!ing || ing.group !== group) {
        errors.push(`Item inválido em ${GROUP_LABEL[group]}.`);
        continue;
      }
      if (!ing.available) errors.push(`${ing.name} está indisponível no momento.`);
      if (style && !ingredientFitsStyle(ing, style)) errors.push(`${ing.name} não faz parte do estilo ${style.name}.`);
      picked[group].push(ing);
    }
    if (size) {
      const max = limitFor(size, group);
      if (ids.length > max) {
        errors.push(`O tamanho ${size.name} permite no máximo ${max} ${GROUP_LABEL[group]}${max === 1 ? "" : "s"}.`);
      }
    }
  }

  if (config.proteinIds.length < 1) errors.push("Escolha pelo menos uma proteína.");
  if (config.baseIds.length < 1) errors.push("Escolha pelo menos uma base.");

  for (const id of config.extraProteinIds) {
    const ing = byId.get(id);
    if (!config.proteinIds.includes(id)) errors.push("Porção extra só vale para proteínas escolhidas.");
    else if (!ing || ing.extraPrice == null) errors.push(`${ing?.name ?? "Item"} não aceita porção extra.`);
  }

  const selected = new Set(all);
  for (const rule of catalog.rules) {
    if (!rule.active || !selected.has(rule.ingredientId)) continue;
    if (rule.conflictIngredientId && selected.has(rule.conflictIngredientId)) errors.push(rule.description);
    if (rule.sizeId && rule.sizeId === config.sizeId) errors.push(rule.description);
  }

  let unitPrice = 0;
  if (size) {
    unitPrice += size.customBasePrice;
    breakdown.push({ label: `Marmita ${size.name} (${size.grams} g)`, amount: size.customBasePrice });
  }
  for (const [group] of groups) {
    for (const ing of picked[group]) {
      if (ing.price > 0) {
        unitPrice += ing.price;
        breakdown.push({ label: ing.name, amount: ing.price });
      }
    }
  }
  for (const id of config.extraProteinIds) {
    const ing = byId.get(id);
    if (ing?.extraPrice != null && config.proteinIds.includes(id)) {
      unitPrice += ing.extraPrice;
      breakdown.push({ label: `${ing.name} extra${ing.extraGrams ? ` (+${ing.extraGrams} g)` : ""}`, amount: ing.extraPrice });
    }
  }

  // Nutrição
  let nutrition: Nutrition | null = null;
  const everything = [...picked.PROTEIN, ...picked.BASE, ...picked.SIDE, ...picked.ADDON];
  const addonsHaveGrams = picked.ADDON.every((a) => a.extraGrams != null);
  if (size && everything.length > 0 && everything.every(hasNutrition) && addonsHaveGrams) {
    const portions: [PricingIngredient, number][] = [];
    const share = (total: number, n: number) => (n > 0 ? total / n : 0);
    for (const p of picked.PROTEIN) {
      let g = share(size.proteinGrams, picked.PROTEIN.length);
      if (config.extraProteinIds.includes(p.id)) g += p.extraGrams ?? 0;
      portions.push([p, g]);
    }
    for (const b of picked.BASE) portions.push([b, share(size.baseGrams, picked.BASE.length)]);
    for (const s of picked.SIDE) portions.push([s, share(size.sidesGrams, picked.SIDE.length)]);
    for (const a of picked.ADDON) portions.push([a, a.extraGrams ?? 0]);
    const n: Nutrition = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodiumMg: 0, grams: 0 };
    for (const [i, g] of portions) {
      const f = g / 100;
      n.kcal += i.kcalPer100g! * f;
      n.protein += i.proteinPer100g! * f;
      n.carbs += i.carbsPer100g! * f;
      n.fat += i.fatPer100g! * f;
      n.fiber += i.fiberPer100g! * f;
      n.sodiumMg += i.sodiumMgPer100g! * f;
      n.grams += g;
    }
    nutrition = {
      kcal: Math.round(n.kcal),
      protein: Math.round(n.protein * 10) / 10,
      carbs: Math.round(n.carbs * 10) / 10,
      fat: Math.round(n.fat * 10) / 10,
      fiber: Math.round(n.fiber * 10) / 10,
      sodiumMg: Math.round(n.sodiumMg),
      grams: Math.round(n.grams),
    };
  }

  const allergens = [...new Set(everything.flatMap((i) => i.allergens))].sort();
  const names = (list: PricingIngredient[]) => list.map((i) => i.name).join(", ");
  const parts = [
    style ? `Estilo ${style.name}` : null,
    picked.PROTEIN.length
      ? `Proteína: ${picked.PROTEIN.map((p) => (config.extraProteinIds.includes(p.id) ? `${p.name} (extra)` : p.name)).join(", ")}`
      : null,
    picked.BASE.length ? `Base: ${names(picked.BASE)}` : null,
    picked.SIDE.length ? `Acompanhamentos: ${names(picked.SIDE)}` : null,
    picked.ADDON.length ? `Adicionais: ${names(picked.ADDON)}` : null,
  ].filter(Boolean);

  const uniqueErrors = [...new Set(errors)];
  return {
    ok: uniqueErrors.length === 0,
    errors: uniqueErrors,
    unitPrice,
    breakdown,
    nutrition,
    allergens,
    description: parts.join(" · "),
  };
}

// ---------------------------------------------------------------------------
// Totais do pedido

export interface CouponData {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
}

export function couponDiscount(
  coupon: CouponData | null | undefined,
  subtotal: number,
  now: Date = new Date(),
): { discount: number; error?: string } {
  if (!coupon) return { discount: 0 };
  if (!coupon.active) return { discount: 0, error: "Cupom inativo." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) return { discount: 0, error: "Cupom expirado." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { discount: 0, error: "Cupom esgotado." };
  if (subtotal < coupon.minOrder) {
    return { discount: 0, error: `Cupom válido para pedidos a partir de ${formatBRL(coupon.minOrder)}.` };
  }
  const raw = coupon.type === "PERCENT" ? Math.floor((subtotal * Math.min(coupon.value, 100)) / 100) : coupon.value;
  return { discount: Math.min(raw, subtotal) };
}

export function pointsRedemption(
  points: number,
  requested: boolean,
  settings: { pointsPerRedemption: number; redemptionValue: number },
  maxDiscount: number,
): { pointsUsed: number; discount: number } {
  if (!requested || settings.pointsPerRedemption <= 0 || maxDiscount <= 0) return { pointsUsed: 0, discount: 0 };
  let blocks = Math.floor(points / settings.pointsPerRedemption);
  const maxBlocks = Math.floor(maxDiscount / settings.redemptionValue);
  blocks = Math.min(blocks, maxBlocks);
  return { pointsUsed: blocks * settings.pointsPerRedemption, discount: blocks * settings.redemptionValue };
}

export function deliveryFeeFor(
  fulfillment: "DELIVERY" | "PICKUP",
  zoneFee: number | null,
  subtotal: number,
  freeDeliveryMin: number | null,
): number {
  if (fulfillment === "PICKUP") return 0;
  if (zoneFee == null) return 0;
  if (freeDeliveryMin != null && subtotal >= freeDeliveryMin) return 0;
  return zoneFee;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
