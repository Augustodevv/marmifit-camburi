import { describe, expect, it } from "vitest";
import {
  couponDiscount,
  deliveryFeeFor,
  ingredientBlockReason,
  pointsRedemption,
  productPrice,
  quoteCustom,
  type Catalog,
  type CustomConfig,
  type PricingIngredient,
} from "@/lib/pricing";

function ing(p: Partial<PricingIngredient> & Pick<PricingIngredient, "id" | "group">): PricingIngredient {
  return {
    slug: p.id,
    name: p.id,
    price: 0,
    extraPrice: null,
    extraGrams: null,
    available: true,
    isVegetarian: false,
    isVegan: false,
    isLowCarb: false,
    allergens: [],
    kcalPer100g: null,
    proteinPer100g: null,
    carbsPer100g: null,
    fatPer100g: null,
    fiberPer100g: null,
    sodiumMgPer100g: null,
    ...p,
  };
}

const catalog: Catalog = {
  sizes: [
    { id: "m", slug: "media", name: "Média", grams: 500, customBasePrice: 2490, priceMultiplier: 10000, maxProteins: 1, maxBases: 2, maxSides: 2, maxAddons: 2, proteinGrams: 150, baseGrams: 200, sidesGrams: 150, active: true },
    { id: "f", slug: "familia", name: "Família", grams: 1000, customBasePrice: 5490, priceMultiplier: 22000, maxProteins: 3, maxBases: 3, maxSides: 4, maxAddons: 6, proteinGrams: 300, baseGrams: 400, sidesGrams: 300, active: true },
    { id: "off", slug: "off", name: "Off", grams: 1, customBasePrice: 1, priceMultiplier: 1, maxProteins: 1, maxBases: 1, maxSides: 1, maxAddons: 1, proteinGrams: 1, baseGrams: 1, sidesGrams: 1, active: false },
  ],
  styles: [
    { id: "trad", slug: "tradicional", name: "Tradicional", requireVegetarian: false, requireVegan: false, requireLowCarb: false, active: true },
    { id: "veg", slug: "vegetariano", name: "Vegetariano", requireVegetarian: true, requireVegan: false, requireLowCarb: false, active: true },
    { id: "lc", slug: "low-carb", name: "Low carb", requireVegetarian: false, requireVegan: false, requireLowCarb: true, active: true },
  ],
  ingredients: [
    ing({ id: "frango", group: "PROTEIN", extraPrice: 690, extraGrams: 100 }),
    ing({ id: "peixe", group: "PROTEIN", price: 400 }),
    ing({ id: "tofu", group: "PROTEIN", price: 200, isVegetarian: true, isVegan: true }),
    ing({ id: "arroz", group: "BASE", isVegetarian: true, isVegan: true }),
    ing({ id: "couveflor", group: "BASE", price: 200, isVegetarian: true, isLowCarb: true }),
    ing({ id: "macarrao", group: "BASE", allergens: ["Glúten"] }),
    ing({ id: "pure", group: "BASE", allergens: ["Leite"] }),
    ing({ id: "feijao", group: "SIDE" }),
    ing({ id: "salada", group: "SIDE", isLowCarb: true }),
    ing({ id: "brocolis", group: "SIDE", isLowCarb: true }),
    ing({ id: "acabou", group: "SIDE", available: false }),
    ing({ id: "queijo", group: "ADDON", price: 350, allergens: ["Leite"] }),
  ],
  rules: [
    { id: "r1", description: "Peixe não no Família", ingredientId: "peixe", conflictIngredientId: null, sizeId: "f", active: true },
    { id: "r2", description: "Macarrão ou purê", ingredientId: "macarrao", conflictIngredientId: "pure", sizeId: null, active: true },
    { id: "r3", description: "Regra inativa", ingredientId: "frango", conflictIngredientId: "arroz", sizeId: null, active: false },
  ],
};

const base: CustomConfig = {
  styleId: "trad",
  sizeId: "m",
  proteinIds: ["frango"],
  extraProteinIds: [],
  baseIds: ["arroz"],
  sideIds: ["feijao", "salada"],
  addonIds: [],
};

describe("quoteCustom", () => {
  it("soma preço base do tamanho e acréscimos", () => {
    const q = quoteCustom(catalog, { ...base, addonIds: ["queijo"] });
    expect(q.ok).toBe(true);
    expect(q.unitPrice).toBe(2490 + 350);
    expect(q.allergens).toEqual(["Leite"]);
  });

  it("cobra porção extra de proteína", () => {
    const q = quoteCustom(catalog, { ...base, extraProteinIds: ["frango"] });
    expect(q.unitPrice).toBe(2490 + 690);
  });

  it("recusa porção extra em proteína sem extraPrice", () => {
    const q = quoteCustom(catalog, { ...base, proteinIds: ["peixe"], extraProteinIds: ["peixe"] });
    expect(q.ok).toBe(false);
  });

  it("respeita limite de escolhas por tamanho", () => {
    const q = quoteCustom(catalog, { ...base, sideIds: ["feijao", "salada", "brocolis"] });
    expect(q.ok).toBe(false);
    expect(q.errors.join(" ")).toMatch(/no máximo 2 acompanhamentos/);
  });

  it("exige proteína e base", () => {
    const q = quoteCustom(catalog, { ...base, proteinIds: [], baseIds: [] });
    expect(q.errors).toContain("Escolha pelo menos uma proteína.");
    expect(q.errors).toContain("Escolha pelo menos uma base.");
  });

  it("bloqueia ingrediente indisponível", () => {
    expect(quoteCustom(catalog, { ...base, sideIds: ["acabou"] }).ok).toBe(false);
  });

  it("aplica restrição do estilo vegetariano", () => {
    expect(quoteCustom(catalog, { ...base, styleId: "veg" }).ok).toBe(false);
    expect(quoteCustom(catalog, { ...base, styleId: "veg", proteinIds: ["tofu"], sideIds: [] }).ok).toBe(true);
  });

  it("aplica restrição low carb só em bases e acompanhamentos", () => {
    expect(quoteCustom(catalog, { ...base, styleId: "lc" }).ok).toBe(false);
    const q = quoteCustom(catalog, { ...base, styleId: "lc", baseIds: ["couveflor"], sideIds: ["salada"] });
    expect(q.ok).toBe(true);
    expect(q.unitPrice).toBe(2490 + 200);
  });

  it("aplica regras de combinação ativas", () => {
    expect(quoteCustom(catalog, { ...base, sizeId: "f", proteinIds: ["peixe"] }).errors).toContain("Peixe não no Família");
    expect(quoteCustom(catalog, { ...base, baseIds: ["macarrao", "pure"] }).errors).toContain("Macarrão ou purê");
    expect(quoteCustom(catalog, base).ok).toBe(true); // regra inativa ignorada
  });

  it("recusa tamanho inativo, itens repetidos e grupo errado", () => {
    expect(quoteCustom(catalog, { ...base, sizeId: "off" }).ok).toBe(false);
    expect(quoteCustom(catalog, { ...base, sideIds: ["feijao", "feijao"] }).ok).toBe(false);
    expect(quoteCustom(catalog, { ...base, baseIds: ["frango"] }).ok).toBe(false);
  });

  it("não calcula nutrição sem dados completos", () => {
    expect(quoteCustom(catalog, base).nutrition).toBeNull();
  });

  it("calcula nutrição proporcional quando todos os itens têm dados", () => {
    const full = (i: PricingIngredient) => ({ ...i, kcalPer100g: 100, proteinPer100g: 10, carbsPer100g: 5, fatPer100g: 2, fiberPer100g: 1, sodiumMgPer100g: 50 });
    const c: Catalog = { ...catalog, ingredients: catalog.ingredients.map(full) };
    const q = quoteCustom(c, { ...base, extraProteinIds: ["frango"] });
    // 150 g frango + 100 g extra + 200 g arroz + 150 g acompanhamentos = 600 g
    expect(q.nutrition).toEqual({ kcal: 600, protein: 60, carbs: 30, fat: 12, fiber: 6, sodiumMg: 300, grams: 600 });
  });
});

describe("ingredientBlockReason", () => {
  it("explica indisponibilidade, estilo e conflitos", () => {
    const find = (id: string) => catalog.ingredients.find((i) => i.id === id)!;
    expect(ingredientBlockReason(catalog, base, find("acabou"))).toBe("Indisponível hoje");
    expect(ingredientBlockReason(catalog, { ...base, styleId: "veg" }, find("frango"))).toMatch(/Vegetariano/);
    expect(ingredientBlockReason(catalog, { ...base, baseIds: ["macarrao"] }, find("pure"))).toBe("Macarrão ou purê");
    expect(ingredientBlockReason(catalog, { ...base, sizeId: "f" }, find("peixe"))).toBe("Peixe não no Família");
    expect(ingredientBlockReason(catalog, base, find("feijao"))).toBeNull();
  });
});

describe("productPrice", () => {
  it("aplica multiplicador do tamanho e arredonda", () => {
    expect(productPrice({ basePrice: 2690, hasSizes: true }, { priceMultiplier: 12000 })).toBe(3230);
    expect(productPrice({ basePrice: 2690, hasSizes: true }, { priceMultiplier: 10000 })).toBe(2690);
    expect(productPrice({ basePrice: 9990, hasSizes: false }, { priceMultiplier: 22000 })).toBe(9990);
  });
});

describe("cupons, pontos e frete", () => {
  const coupon = { code: "X", type: "PERCENT" as const, value: 10, minOrder: 3000, maxUses: 5, usedCount: 0, expiresAt: null, active: true };
  it("calcula desconto percentual e fixo", () => {
    expect(couponDiscount(coupon, 5000).discount).toBe(500);
    expect(couponDiscount({ ...coupon, type: "FIXED", value: 700 }, 5000).discount).toBe(700);
    expect(couponDiscount({ ...coupon, type: "FIXED", value: 9000, minOrder: 0 }, 5000).discount).toBe(5000);
  });
  it("valida mínimo, validade, uso e status", () => {
    expect(couponDiscount(coupon, 2000).error).toBeDefined();
    expect(couponDiscount({ ...coupon, expiresAt: new Date("2020-01-01") }, 5000).error).toBe("Cupom expirado.");
    expect(couponDiscount({ ...coupon, usedCount: 5 }, 5000).error).toBe("Cupom esgotado.");
    expect(couponDiscount({ ...coupon, active: false }, 5000).error).toBe("Cupom inativo.");
  });
  it("resgata pontos em blocos sem passar do subtotal", () => {
    const s = { pointsPerRedemption: 100, redemptionValue: 500 };
    expect(pointsRedemption(250, true, s, 10000)).toEqual({ pointsUsed: 200, discount: 1000 });
    expect(pointsRedemption(1000, true, s, 1200)).toEqual({ pointsUsed: 200, discount: 1000 });
    expect(pointsRedemption(1000, false, s, 10000)).toEqual({ pointsUsed: 0, discount: 0 });
  });
  it("frete: retirada grátis e frete grátis acima do mínimo", () => {
    expect(deliveryFeeFor("PICKUP", 700, 1000, null)).toBe(0);
    expect(deliveryFeeFor("DELIVERY", 700, 1000, 12000)).toBe(700);
    expect(deliveryFeeFor("DELIVERY", 700, 12000, 12000)).toBe(0);
  });
});
