import "server-only";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getActiveSizes } from "@/server/catalog";

/** Dados do visitante e tamanho padrão para listas de produtos. */
export async function getListingContext() {
  const [session, sizes] = await Promise.all([getSession(), getActiveSizes()]);
  const favorites = session
    ? await db.favorite.findMany({ where: { userId: session.sub }, select: { productId: true } })
    : [];
  const defaultSize =
    sizes.find((s) => s.slug === "media") ?? sizes.find((s) => s.priceMultiplier === 10000) ?? sizes[0] ?? null;
  return {
    loggedIn: Boolean(session),
    favoriteIds: new Set(favorites.map((f) => f.productId)),
    defaultSize,
    sizes,
  };
}
