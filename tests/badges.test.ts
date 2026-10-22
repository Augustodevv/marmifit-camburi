import { describe, expect, it } from "vitest";
import { productBadges } from "@/lib/badges";

const base = { category: { slug: "tradicionais", isCombo: false }, tags: [], allergens: [], ingredientsText: "Arroz, feijão, frango" };

describe("selos dos pratos", () => {
  it("usa categoria e tags", () => {
    expect(productBadges({ ...base, category: { slug: "fitness", isCombo: false } })).toContain("fit");
    expect(productBadges({ ...base, tags: ["Low carb"] })).toContain("low-carb");
    expect(productBadges({ ...base, category: { slug: "veganas", isCombo: false } })).toContain("vegano");
  });
  it("vegano não repete vegetariano", () => {
    const b = productBadges({ ...base, category: { slug: "vegetarianas", isCombo: false }, tags: ["vegano"] });
    expect(b).toContain("vegano");
    expect(b).not.toContain("vegetariano");
  });
  it("sem glúten só com ingredientes cadastrados, sem o alergênico e fora de combos", () => {
    expect(productBadges(base)).toContain("sem-gluten");
    expect(productBadges({ ...base, allergens: ["Glúten"] })).not.toContain("sem-gluten");
    expect(productBadges({ ...base, ingredientsText: null })).not.toContain("sem-gluten");
    expect(productBadges({ ...base, category: { slug: "combos-familiares", isCombo: true } })).not.toContain("sem-gluten");
  });
});
