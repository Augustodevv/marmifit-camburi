import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/store/section";
import { ProductCard } from "@/components/store/product-card";
import { todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { cn } from "@/lib/utils";
import { listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";

export const metadata: Metadata = {
  title: "Marmitas do dia",
  description: "Um prato especial a cada dia da semana: strogonoff, feijoada light, moqueca caiçara e mais.",
  alternates: { canonical: "/marmitas-do-dia" },
};

export default async function DailyPage() {
  const today = todayDailyIndex();
  const [products, ctx] = await Promise.all([listProducts({ NOT: { dailyDays: { isEmpty: true } } }), getListingContext()]);
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <PageHeader eyebrow="Cardápio da semana" title="Marmitas do dia" description="Todo dia um prato diferente, feito em pequena quantidade. Peça hoje ou agende para o dia do seu preferido." />
      <div className="container-page py-10">
        <nav aria-label="Dias" className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {order.map((d) => (
            <Link key={d} href={`#dia-${d}`} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", d === today ? "bg-tangerine text-forest" : "bg-white text-forest hover:bg-cream-200")}>
              {WEEKDAYS[d]}{d === today ? " · hoje" : ""}
            </Link>
          ))}
        </nav>
        <div className="mt-10 space-y-14">
          {order.map((d) => {
            const list = products.filter((p) => p.dailyDays.includes(d));
            return (
              <section key={d} id={`dia-${d}`} className="scroll-mt-28" aria-labelledby={`h-${d}`}>
                <h2 id={`h-${d}`} className="flex items-center gap-3 text-3xl font-semibold text-forest">
                  {WEEKDAYS[d]}
                  {d === today && <span className="rounded-full bg-leaf px-3 py-1 font-sans text-xs font-bold uppercase tracking-wider text-white">Hoje</span>}
                </h2>
                {list.length === 0 ? (
                  <p className="mt-3 text-muted-foreground">Sem prato especial neste dia. Confira o <Link href="/cardapio" className="font-semibold text-leaf underline">cardápio fixo</Link>.</p>
                ) : (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => (
                      <ProductCard key={p.id} product={p} defaultSize={ctx.defaultSize} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
