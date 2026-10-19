import "server-only";
import { getActiveSizes } from "@/server/catalog";

/** Tamanho padrão e tamanhos ativos para listas de produtos. */
export async function getListingContext() {
  const sizes = await getActiveSizes();
  const defaultSize =
    sizes.find((s) => s.slug === "media") ?? sizes.find((s) => s.priceMultiplier === 10000) ?? sizes[0] ?? null;
  return { defaultSize, sizes };
}
