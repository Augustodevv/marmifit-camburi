import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChefHat, ClipboardList, Bike, Sparkles } from "lucide-react";
import { Hero } from "@/components/store/hero";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { CategoryIcon } from "@/components/store/category-icon";
import { FoodImage } from "@/components/store/food-image";
import { Marquee, Reveal, StaggerGrid, StaggerItem } from "@/components/store/motion";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { getSettings, listCategories, listProducts } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";
import { shortCategoryName } from "@/lib/format";

const MARQUEE = ["Frango grelhado", "Low carb", "Moqueca caiçara", "Fitness", "Vegano", "Feijoada light", "Proteína extra", "Monte a sua", "Combos da semana"];

export default async function HomePage() {
  const today = todayDailyIndex();
  const [settings, categories, featured, daily, weekly, ctx, minSize] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts({ featured: true, dailyDays: { isEmpty: true } }),
    listProducts({ dailyDays: { has: today } }),
    listProducts({ category: { slug: "combos-semanais" } }),
    getListingContext(),
    db.size.findFirst({ where: { active: true }, orderBy: { customBasePrice: "asc" } }),
  ]);
  const todays = daily[0];
  const sideImage = featured.find((p) => p.image && p.image !== settings.heroImage)?.image ?? null;

  return (
    <>
      <Hero heroImage={settings.heroImage} sideImage={sideImage} fromPrice={minSize ? formatBRL(minSize.customBasePrice) : "—"} isOpen={settings.acceptingOrders} />

      {/* faixas animadas */}
      <div className="relative -mt-6 overflow-hidden py-6">
        <div className="-rotate-2 bg-tangerine py-3 font-display text-2xl font-semibold text-forest shadow-lift sm:text-3xl">
          <Marquee items={MARQUEE} />
        </div>
        <div className="-mt-1 rotate-1 bg-leaf py-2 font-sans text-sm font-bold uppercase tracking-[0.25em] text-cream">
          <Marquee items={["Feito hoje", "Camburi • SP", "Pix ou cartão", "Entrega rápida", "Sem cadastro"]} reverse />
        </div>
      </div>

      <section className="container-page mt-6" aria-labelledby="categorias">
        <h2 id="categorias" className="sr-only">Categorias</h2>
        <StaggerGrid className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <StaggerItem key={c.id} className="h-auto shrink-0">
              <Link
                href={c.slug === "personalizadas" ? "/monte-sua-marmita" : `/cardapio?categoria=${c.slug}`}
                className="group flex snap-start items-center gap-2.5 rounded-full border border-cream-300 bg-white py-2 pl-2 pr-4 text-sm font-semibold text-forest shadow-soft transition duration-300 hover:-translate-y-1 hover:rotate-[-2deg] hover:border-tangerine hover:shadow-lift"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-leaf-100 text-leaf-700 transition duration-300 group-hover:scale-110 group-hover:bg-tangerine group-hover:text-forest">
                  <CategoryIcon slug={c.slug} className="size-4" />
                </span>
                {shortCategoryName(c.name)}
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {todays && (
        <Reveal className="container-page mt-16">
          <section aria-labelledby="prato-do-dia" className="group grid overflow-hidden rounded-panel bg-forest text-cream shadow-lift md:grid-cols-2">
            <div className="overflow-hidden">
              <FoodImage src={todays.image} alt={todays.name} seed={todays.slug} className="aspect-[4/3] transition duration-700 group-hover:scale-105 md:aspect-auto md:h-full md:min-h-[380px]" />
            </div>
            <div className="relative flex flex-col justify-center p-8 sm:p-12">
              <span className="absolute right-8 top-8 rotate-12 rounded-full bg-tangerine px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-forest shadow-lift">Só hoje!</span>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Prato do dia · {WEEKDAYS[today]}</p>
              <h2 id="prato-do-dia" className="mt-3 text-3xl font-semibold sm:text-5xl">{todays.name}</h2>
              <p className="mt-4 text-cream/75">{todays.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/cardapio/${todays.slug}`} className={`${buttonVariants({ variant: "accent", size: "xl" })} group/btn`}>
                  Quero esse <ArrowRight className="size-5 transition group-hover/btn:translate-x-1" aria-hidden />
                </Link>
                <Link href="/marmitas-do-dia" className="text-sm font-semibold text-cream/80 underline-offset-4 hover:underline">
                  Ver a semana toda
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <section className="container-page mt-24" aria-labelledby="destaques">
        <Reveal>
          <SectionHeading eyebrow="Os favoritos da casa" title="Destaques do cardápio" href="/cardapio" hrefLabel="Ver cardápio completo" />
        </Reveal>
        <h2 id="destaques" className="sr-only">Destaques</h2>
        <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.slice(0, 8).map((p, i) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} defaultSize={ctx.defaultSize} priority={i < 2} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      <section className="container-page mt-28" aria-labelledby="como-funciona">
        <Reveal>
          <SectionHeading eyebrow="Simples assim" title="Do cardápio à sua mesa" />
        </Reveal>
        <h2 id="como-funciona" className="sr-only">Como funciona</h2>
        <StaggerGrid className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { icon: ClipboardList, title: "Escolha ou monte", text: "Pegue um prato pronto ou monte a sua marmita com tamanho, proteína, base e acompanhamentos." },
            { icon: ChefHat, title: "A gente prepara", text: "Cozinhamos no dia, com ingredientes frescos. Você acompanha cada etapa pelo site." },
            { icon: Bike, title: "Entrega ou retirada", text: "Receba em casa no horário que escolher ou retire na nossa cozinha em Camburi." },
          ].map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-cream-300 bg-white p-7 shadow-soft transition duration-300 hover:-translate-y-2 hover:border-tangerine hover:shadow-lift">
                <span className="absolute -right-2 -top-4 font-display text-8xl font-semibold text-cream-200 transition duration-500 group-hover:text-tangerine/30">{i + 1}</span>
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-leaf-700 text-white transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-tangerine group-hover:text-forest">
                  <s.icon className="size-7" aria-hidden />
                </span>
                <h3 className="relative mt-5 text-2xl font-semibold text-forest">{s.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      <Reveal className="container-page mt-28">
        <section className="relative grid items-center overflow-hidden rounded-panel bg-tangerine p-8 sm:p-14 lg:grid-cols-[1.1fr_1fr]">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-80 animate-[spin_30s_linear_infinite] rounded-full border-[28px] border-dashed border-white/25" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest/70">Configurador</p>
            <h2 className="mt-2 text-4xl font-semibold text-forest sm:text-6xl">Monte a marmita perfeita para o seu objetivo</h2>
            <p className="mt-4 text-lg text-forest/80">
              Low carb, vegana, proteína em dobro ou do jeito da vó. O preço muda na hora a cada escolha.
            </p>
            <Link href="/monte-sua-marmita" className={`${buttonVariants({ size: "xl" })} group mt-8`}>
              <Sparkles className="size-5 transition group-hover:rotate-12" aria-hidden /> Começar agora
            </Link>
          </div>
          <div className="relative mt-10 hidden h-80 lg:block">
            <div className="absolute right-24 top-0 w-60 rotate-6 overflow-hidden rounded-3xl border-4 border-white shadow-2xl transition duration-500 hover:rotate-0 hover:scale-105">
              <div className="relative aspect-[4/3]"><Image src="/images/produtos/vegano.png" alt="" fill sizes="240px" className="object-cover" /></div>
            </div>
            <div className="absolute bottom-0 right-0 w-64 -rotate-6 overflow-hidden rounded-3xl border-4 border-white shadow-2xl transition duration-500 hover:rotate-0 hover:scale-105">
              <div className="relative aspect-[4/3]"><Image src="/images/produtos/fitness.png" alt="" fill sizes="256px" className="object-cover" /></div>
            </div>
          </div>
        </section>
      </Reveal>

      {weekly.length > 0 && (
        <section className="container-page mt-28" aria-labelledby="semana">
          <Reveal>
            <SectionHeading
              eyebrow="Combos semanais"
              title="Sua semana resolvida"
              description="Kits com desconto para quem quer praticidade de segunda a sexta."
              href="/combos-e-promocoes"
              hrefLabel="Ver combos e promoções"
            />
          </Reveal>
          <h2 id="semana" className="sr-only">Combos semanais</h2>
          <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {weekly.slice(0, 3).map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} defaultSize={ctx.defaultSize} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      )}
    </>
  );
}
