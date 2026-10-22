/** Selos de estilo exibidos nos cards e na página do prato, derivados do cadastro (categoria, tags e alergênicos). */
export type BadgeId = "fit" | "low-carb" | "vegano" | "vegetariano" | "sem-gluten";

export const BADGE_LABEL: Record<BadgeId, string> = {
  fit: "Fit",
  "low-carb": "Low carb",
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  "sem-gluten": "Sem glúten",
};

interface BadgeSource {
  category: { slug: string; isCombo: boolean };
  tags: string[];
  allergens: string[];
  ingredientsText: string | null;
}

export function productBadges(p: BadgeSource): BadgeId[] {
  const tags = p.tags.map((t) => t.toLowerCase());
  const is = (slug: string, tag: string) => p.category.slug === slug || tags.includes(tag);
  const out: BadgeId[] = [];
  if (is("fitness", "fitness")) out.push("fit");
  if (is("low-carb", "low carb")) out.push("low-carb");
  if (is("veganas", "vegano")) out.push("vegano");
  else if (is("vegetarianas", "vegetariano")) out.push("vegetariano");
  // só com ingredientes cadastrados e fora dos combos (sabores sortidos não têm receita fixa)
  if (!p.category.isCombo && p.ingredientsText && !p.allergens.includes("Glúten")) out.push("sem-gluten");
  return out;
}
