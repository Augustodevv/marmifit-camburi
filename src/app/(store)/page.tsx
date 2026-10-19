import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, Bike, Star, Sparkles } from "lucide-react";
import { Hero } from "@/components/store/hero";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { CategoryIcon } from "@/components/store/category-icon";
import { FoodImage } from "@/components/store/food-image";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { isOpenAt, todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { getSettings, listCategories, listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";
import { shortCategoryName } from "@/lib/format";

export default async function HomePage() {
  const today = todayDailyIndex();
  const [settings, categories, featured, daily, weekly, ctx, reviews, minSize] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts({ featured: true, dailyDays: { isEmpty: true } }),
    listProducts({ dailyDays: { has: today } }),
    listProducts({ category: { slug: "combos-semanais" } }),
    getListingContext(),
    db.review.findMany({
      where: { approved: true, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { name: true } }, product: { select: { name: true } } },
    }),
    db.size.findFirst({ where: { active: true }, orderBy: { customBasePrice: "asc" } }),
  ]);
  const isOpen = settings.acceptingOrders && isOpenAt(settings.hours, new Date());
  const todays = daily[0];
  const card = (p: (typeof featured)[number], i?: number) => (
    <ProductCard
      key={p.id}
      product={p}
      defaultSize={ctx.defaultSize}
     
     
      priority={i !== undefined && i < 2}
    />
  );

  return (
    <>
      <Hero heroImage={settings.heroImage} fromPrice={minSize ? formatBRL(minSize.customBasePrice) : "—"} isOpen={isOpen} />

      <section className="container-page" aria-labelledby="categorias">
        <h2 id="categorias" className="sr-only">Categorias</h2>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={c.slug === "personalizadas" ? "/monte-sua-marmita" : `/cardapio?categoria=${c.slug}`}
              className="group flex shrink-0 snap-start items-center gap-2.5 rounded-full border border-cream-300 bg-white py-2 pl-2 pr-4 text-sm font-semibold text-forest shadow-soft transition hover:-translate-y-0.5 hover:border-leaf"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-leaf-100 text-leaf transition group-hover:bg-leaf group-hover:text-white">
                <CategoryIcon slug={c.slug} className="size-4" />
              </span>
              {shortCategoryName(c.name)}
            </Link>
          ))}
        </div>
      </section>

      {todays && (
        <section className="container-page mt-16" aria-labelledby="prato-do-dia">
          <div className="grid overflow-hidden rounded-[2rem] bg-forest text-cream shadow-lift md:grid-cols-2">
            <FoodImage src={todays.image} alt={todays.name} seed={todays.slug} className="aspect-[4/3] md:aspect-auto md:min-h-[380px]" />
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Prato do dia · {WEEKDAYS[today]}</p>
              <h2 id="prato-do-dia" className="mt-3 text-3xl font-semibold sm:text-4xl">{todays.name}</h2>
              <p className="mt-4 text-cream/75">{todays.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/cardapio/${todays.slug}`} className={buttonVariants({ variant: "accent", size: "xl" })}>
                  Quero esse <ArrowRight className="size-5" aria-hidden />
                </Link>
                <Link href="/marmitas-do-dia" className="text-sm font-semibold text-cream/80 underline-offset-4 hover:underline">
                  Ver a semana toda
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-page mt-20" aria-labelledby="destaques">
        <SectionHeading eyebrow="Os favoritos da casa" title="Destaques do cardápio" href="/cardapio" hrefLabel="Ver cardápio completo" />
        <h2 id="destaques" className="sr-only">Destaques</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{featured.slice(0, 8).map(card)}</div>
      </section>

      <section className="container-page mt-24" aria-labelledby="como-funciona">
        <SectionHeading eyebrow="Simples assim" title="Do cardápio à sua mesa" />
        <h2 id="como-funciona" className="sr-only">Como funciona</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: ClipboardList, title: "Escolha ou monte", text: "Pegue um prato pronto ou monte a sua marmita com tamanho, proteína, base e acompanhamentos." },
            { icon: ChefHat, title: "A gente prepara", text: "Cozinhamos no dia, com ingredientes frescos. Você acompanha cada etapa pelo site." },
            { icon: Bike, title: "Entrega ou retirada", text: "Receba em casa no horário agendado ou retire na nossa cozinha em Camburi." },
          ].map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-cream-300 bg-white p-7 shadow-soft">
              <span className="absolute right-6 top-5 font-display text-5xl font-semibold text-cream-300">{i + 1}</span>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf">
                <s.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-forest">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-tangerine p-8 sm:p-14">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/25" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 right-40 size-56 rounded-full bg-forest/10" aria-hidden />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest/70">Configurador</p>
            <h2 className="mt-2 text-3xl font-semibold text-forest sm:text-5xl">Monte a marmita perfeita para o seu objetivo</h2>
            <p className="mt-4 text-forest/80">
              Low carb, vegetariana, proteína em dobro ou do jeito da vó. Veja o preço atualizar a cada escolha, com
              ingredientes e alergênicos sempre à vista.
            </p>
            <Link href="/monte-sua-marmita" className={`${buttonVariants({ size: "xl" })} mt-8`}>
              <Sparkles className="size-5" aria-hidden /> Começar agora
            </Link>
          </div>
        </div>
      </section>

      {weekly.length > 0 && (
        <section className="container-page mt-24" aria-labelledby="semana">
          <SectionHeading
            eyebrow="Combos semanais"
            title="Sua semana resolvida"
            description="Kits com desconto para quem quer praticidade de segunda a sexta."
            href="/combos-e-promocoes"
            hrefLabel="Ver combos e promoções"
          />
          <h2 id="semana" className="sr-only">Combos semanais</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{weekly.slice(0, 3).map((p) => card(p))}</div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="container-page mt-24" aria-labelledby="avaliacoes">
          <SectionHeading eyebrow="Avaliações verificadas" title="Quem pede, recomenda" />
          <h2 id="avaliacoes" className="sr-only">Avaliações</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-2xl border border-cream-300 bg-white p-6 shadow-soft">
                <div className="flex gap-0.5" aria-label={`${r.rating} de 5 estrelas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-4 ${i < r.rating ? "fill-tangerine text-tangerine" : "text-cream-300"}`} aria-hidden />
                  ))}
                </div>
                <blockquote className="mt-3 text-forest">“{r.comment}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  {r.user.name.split(" ")[0]} · {r.product.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
