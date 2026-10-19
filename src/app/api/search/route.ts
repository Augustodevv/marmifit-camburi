import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { productPrice } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const [products, size] = await Promise.all([
    db.product.findMany({
      where: {
        active: true,
        category: { active: true },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { ingredientsText: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { category: { select: { name: true } } },
      take: 8,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    }),
    db.size.findFirst({ where: { active: true }, orderBy: { priceMultiplier: "asc" } }),
  ]);
  return NextResponse.json({
    results: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category.name,
      price: productPrice(p, p.hasSizes ? size : null),
      fromPrice: p.hasSizes,
    })),
  });
}
