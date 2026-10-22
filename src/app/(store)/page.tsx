import Link from "next/link";
import { ArrowRight, Bike, CalendarClock, ChefHat, ChevronDown, ClipboardList, Clock, MapPin, Sparkles, Star, Wallet } from "lucide-react";
import { Hero } from "@/components/store/hero";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { FoodImage } from "@/components/store/food-image";
import { Marquee, Reveal, StaggerGrid, StaggerItem } from "@/components/store/motion";
import { UntilMidnight } from "@/components/store/until-midnight";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatBRL, productPrice } from "@/lib/pricing";
import { todayDailyIndex, WEEKDAYS } from "@/lib/hours";
import { blurFor, conventionalImage } from "@/lib/media";
import { shortCategoryName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/seo";
import { getSettings, listCategories, listProducts } from "@/server/catalog";
import { isMercadoPagoConfigured } from "@/server/mercadopago";
import { getListingContext } from "@/server/viewer";

const MARQUEE = ["Frango grelhado", "Low carb", "Moqueca caiçara", "Fitness", "Vegano", "Feijoada light", "Proteína extra", "Monte a sua", "Combos da semana"];

export default async function HomePage() {
  const today = todayDailyIndex();
  const [settings, categories, products, ctx, minSize, zones, reviews] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts(),
    getListingContext(),
    db.size.findFirst({ where: { active: true }, orderBy: { customBasePrice: "asc" } }),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: [{ fee: "asc" }, { district: "asc" }] }),
    db.review.findMany({
      where: { approved: true, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, rating: true, comment: true, user: { select: { name: true } }, product: { select: { name: true } } },
    }),
  ]);

  const featured = products.filter((p) => p.featured && p.dailyDays.length === 0);
  const todays = products.find((p) => p.dailyDays.includes(today));
  const combos = products.filter((p) => p.category.isCombo);
  const onlinePayment = isMercadoPagoConfigured();
  const uniqueByImage = <T extends { image: string | null }>(list: T[]) => [...new Map(list.filter((p) => p.image).map((p) => [p.image, p])).values()];

  // categorias com foto: a da categoria ou, sem ela, a de um prato dela
  const categoryCards = categories
    .filter((c) => !c.isCombo && c.slug !== "do-dia")
    .map((c) => {
      const items = products.filter((p) => p.category.slug === c.slug);
      const withImage = items.find((p) => p.image);
      const photo = c.image ? { src: c.image, blur: c.imageBlur } : withImage ? { src: withImage.image, blur: withImage.imageBlur } : null;
      return { ...c, count: items.length, photo };
    });

  // galeria da cozinha (5 fotos, a primeira ocupa duas linhas): fotos reais em public/images/cozinha;
  // sem elas, fotos dos pratos (sem repetir).
  // TODO(conteúdo): fotos reais da cozinha/equipe em public/images/cozinha/cozinha-1..5.webp
  const kitchen = [1, 2, 3, 4, 5, 6].map((n) => conventionalImage("cozinha", `cozinha-${n}`)).filter((s): s is string => !!s);
  const gallery = kitchen.length
    ? kitchen.slice(0, 5).map((src, i) => ({ src, blur: blurFor(src), alt: `Cozinha da Marmifit em Camburi, foto ${i + 1}` }))
    : uniqueByImage(products)
        .slice(0, 5)
        .map((p) => ({ src: p.image!, blur: p.imageBlur, alt: p.name }));

  const ctaPhotos = uniqueByImage(featured).slice(0, 2);

  const faq = [
    { q: "Preciso criar conta para pedir?", a: "Não. Você pede só com nome e telefone e acompanha o pedido pelo número dele, na página Acompanhar pedido." },
    {
      q: "Quais são as formas de pagamento?",
      a: onlinePayment
        ? "Pix ou cartão pelo Mercado Pago, direto no site. Se preferir, pague na entrega ou na retirada: dinheiro, Pix ou maquininha."
        : "Na entrega ou na retirada: dinheiro, Pix ou maquininha.",
    },
    ...(settings.maxScheduleDays > 0
      ? [{ q: "Posso agendar a entrega?", a: `Sim. No checkout você escolhe o dia e o horário, com até ${settings.maxScheduleDays} dias de antecedência.` }]
      : []),
    {
      q: "Vocês entregam no meu bairro?",
      a: zones.length
        ? `Entregamos em ${zones.length} ${zones.length === 1 ? "bairro" : "bairros"} (lista e taxas logo acima). Você também pode retirar na nossa cozinha: ${settings.pickupAddress}.`
        : `No momento atendemos com retirada na nossa cozinha: ${settings.pickupAddress}.`,
    },
    ...(settings.minOrder > 0 ? [{ q: "Tem pedido mínimo?", a: `Sim, o pedido mínimo é de ${formatBRL(settings.minOrder)}.` }] : []),
    { q: "Posso montar minha própria marmita?", a: "Pode. Em Monte a sua você escolhe estilo, tamanho, proteína, base e acompanhamentos, e o preço muda na hora a cada escolha." },
    { q: "Como sei o que tem em cada prato?", a: "Cada prato mostra os ingredientes e os alergênicos. A informação nutricional só aparece quando foi verificada." },
  ];

  // TODO(conteúdo): confirmar com a loja os textos "Feito no dia" e "Cozinha própria em Camburi"
  const benefits = [
    { icon: ChefHat, title: "Feito no dia", text: "Cozinha própria em Camburi" },
    {
      icon: Bike,
      title: zones.length ? "Entrega ou retirada" : "Retirada na cozinha",
      text: zones.length ? `${zones.length} ${zones.length === 1 ? "bairro atendido" : "bairros atendidos"}` : settings.pickupAddress,
    },
    ...(settings.maxScheduleDays > 0 ? [{ icon: CalendarClock, title: "Agende seu pedido", text: `Até ${settings.maxScheduleDays} dias antes` }] : []),
    { icon: Wallet, title: "Pix, cartão ou dinheiro", text: "Sem cadastro para pedir" },
  ];

  // dados estruturados do restaurante: tudo vem do painel (Entrega e horários) e do cardápio
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const prices = products.map((p) => productPrice(p, p.hasSizes ? ctx.defaultSize : null));
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const instagram = settings.instagram?.replace(/^@/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteUrl}/#restaurante`,
    name: settings.storeName || SITE_NAME,
    alternateName: "Marmitas Camburi",
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    ...(settings.phone || settings.whatsappNumber ? { telephone: `+55${(settings.phone || settings.whatsappNumber)!.replace(/\D/g, "").replace(/^55/, "")}` } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.pickupAddress,
      addressLocality: "São Sebastião",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    servesCuisine: ["Brasileira", "Caseira", "Fitness", "Vegetariana", "Vegana"],
    ...(prices.length ? { priceRange: `${formatBRL(Math.min(...prices))} – ${formatBRL(Math.max(...prices))}` } : {}),
    hasMenu: `${siteUrl}/cardapio`,
    acceptsReservations: false,
    openingHoursSpecification: settings.hours
      .filter((h) => h.enabled)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: days[h.day], opens: h.open, closes: h.close === "24:00" ? "23:59" : h.close })),
    areaServed: zones.length ? zones.map((z) => ({ "@type": "Place", name: `${z.district}, São Sebastião - SP` })) : undefined,
    ...(instagram ? { sameAs: [`https://www.instagram.com/${instagram}`] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero heroImage={settings.heroImage} heroVideo={settings.heroVideo} fromPrice={minSize ? formatBRL(minSize.customBasePrice) : "—"} isOpen={settings.acceptingOrders} />

      {/* benefícios */}
      <section id="beneficios" aria-label="Por que pedir na Marmifit" className="container-page relative z-10 -mt-8 scroll-mt-24 sm:-mt-12">
        <StaggerGrid className={cn("grid grid-cols-2 gap-3 sm:gap-4", benefits.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <div className="flex h-full flex-col gap-3 rounded-card border border-cream-300/70 bg-white p-4 shadow-lift sm:flex-row sm:items-center sm:p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tangerine-100 text-forest">
                  <b.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-base font-semibold leading-tight text-forest sm:text-lg">{b.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{b.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* categorias com foto */}
      <section className="mt-20 sm:mt-28" aria-labelledby="categorias">
        <Reveal className="container-page">
          <SectionHeading id="categorias" eyebrow="Categorias" title="Para cada fome, uma marmita" href="/cardapio" hrefLabel="Ver cardápio completo" />
        </Reveal>
        <StaggerGrid className="container-page mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {categoryCards.map((c) => (
            <StaggerItem key={c.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <Link
                href={c.slug === "personalizadas" ? "/monte-sua-marmita" : `/cardapio?categoria=${c.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-forest shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-float"
              >
                <FoodImage
                  src={c.photo?.src}
                  blurDataURL={c.photo?.blur}
                  alt={c.name}
                  seed={c.slug}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 72vw"
                  className="absolute inset-0"
                  imgClassName="transition duration-700 ease-out group-hover:scale-110"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest via-forest/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-cream">
                  <div>
                    <p className="font-display text-2xl font-semibold leading-tight">{shortCategoryName(c.name)}</p>
                    <p className="mt-1 text-sm text-cream/85">
                      {c.slug === "personalizadas" ? "Monte do seu jeito" : `${c.count} ${c.count === 1 ? "prato" : "pratos"}`}
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest/50 transition duration-300 group-hover:bg-tangerine group-hover:text-forest">
                    <ArrowRight className="size-5" aria-hidden />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* prato do dia */}
      {todays && (
        <Reveal className="container-page mt-20 sm:mt-28">
          <section aria-labelledby="prato-do-dia" className="group grid overflow-hidden rounded-panel bg-forest text-cream shadow-float md:grid-cols-[1.1fr_1fr]">
            <div className="relative">
              <FoodImage
                src={todays.image}
                alt={todays.name}
                seed={todays.slug}
                blurDataURL={todays.imageBlur}
                sizes="(min-width: 768px) 55vw, 100vw"
                className="aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]"
                imgClassName="transition duration-700 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 -rotate-3 rounded-full bg-tangerine px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-forest shadow-lift">
                Só hoje
              </span>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Prato do dia · {WEEKDAYS[today]}</p>
              <h2 id="prato-do-dia" className="mt-3 text-3xl font-semibold sm:text-5xl">{todays.name}</h2>
              <p className="mt-4 text-cream/80">{todays.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-display text-3xl font-semibold text-cream">{formatBRL(productPrice(todays, todays.hasSizes ? ctx.defaultSize : null))}</span>
                <UntilMidnight className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1 font-semibold text-cream/90" />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/cardapio/${todays.slug}`} className={cn(buttonVariants({ variant: "accent", size: "xl" }), "group/btn")}>
                  Quero esse <ArrowRight className="size-5 transition group-hover/btn:translate-x-1" aria-hidden />
                </Link>
                <Link href="/marmitas-do-dia" className="text-sm font-semibold text-cream/85 underline-offset-4 hover:text-cream hover:underline">
                  Ver o cardápio da semana
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* destaques */}
      {featured.length > 0 && (
        <section className="container-page below-fold mt-20 sm:mt-28" aria-labelledby="destaques">
          <Reveal>
            <SectionHeading id="destaques" eyebrow="Os favoritos da casa" title="Destaques do cardápio" href="/cardapio" hrefLabel="Ver cardápio completo" />
          </Reveal>
          <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} defaultSize={ctx.defaultSize} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      )}

      {/* como funciona */}
      <section className="container-page below-fold mt-20 sm:mt-28" aria-labelledby="como-funciona">
        <Reveal>
          <SectionHeading id="como-funciona" eyebrow="Simples assim" title="Do cardápio à sua mesa" />
        </Reveal>
        <StaggerGrid className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: ClipboardList, title: "Escolha ou monte", text: "Pegue um prato pronto ou monte a sua marmita com tamanho, proteína, base e acompanhamentos." },
            { icon: ChefHat, title: "A gente prepara", text: "Cozinhamos no dia, com ingredientes frescos. Você acompanha cada etapa pelo site." },
            { icon: Bike, title: "Entrega ou retirada", text: "Receba em casa no horário que escolher ou retire na nossa cozinha em Camburi." },
          ].map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="relative h-full overflow-hidden rounded-card border border-cream-300 bg-white p-6 shadow-soft sm:p-7">
                <span aria-hidden className="absolute right-4 top-1 font-display text-7xl font-semibold text-cream-200">{i + 1}</span>
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-leaf-700 text-white">
                  <s.icon className="size-6" aria-hidden />
                </span>
                <h3 className="relative mt-5 text-2xl font-semibold text-forest">{s.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      <div className="mt-20 -rotate-1 bg-tangerine py-3 font-display text-2xl font-semibold text-forest sm:mt-28 sm:text-3xl">
        <Marquee items={MARQUEE} />
      </div>

      {/* chamada do configurador */}
      <Reveal className="container-page below-fold mt-20 sm:mt-28">
        <section aria-labelledby="configurador" className="relative grid items-center overflow-hidden rounded-panel bg-forest p-8 text-cream sm:p-14 lg:grid-cols-[1.1fr_1fr]">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,rgb(245_158_66/0.35),transparent),radial-gradient(50%_60%_at_0%_100%,rgb(67_134_91/0.5),transparent)]" />
          <div className="relative max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Monte a sua</p>
            <h2 id="configurador" className="mt-2 text-4xl font-semibold sm:text-6xl">A marmita perfeita para o seu objetivo</h2>
            <p className="mt-4 text-lg text-cream/80">Low carb, vegana, proteína em dobro ou do jeito da vó. O preço muda na hora a cada escolha.</p>
            <Link href="/monte-sua-marmita" className={cn(buttonVariants({ size: "xl", variant: "accent" }), "group mt-8")}>
              <Sparkles className="size-5 transition group-hover:rotate-12" aria-hidden /> Começar agora
            </Link>
          </div>
          {ctaPhotos.length === 2 && (
            <div className="relative mt-10 hidden h-80 lg:block" aria-hidden>
              {ctaPhotos.map((p, i) => (
                <FoodImage
                  key={p.id}
                  src={p.image}
                  blurDataURL={p.imageBlur}
                  alt=""
                  seed={p.slug}
                  sizes="260px"
                  className={cn(
                    "absolute aspect-[4/3] w-64 rounded-card border-4 border-cream shadow-float transition duration-500 hover:rotate-0 hover:scale-105",
                    i === 0 ? "right-24 top-0 rotate-6" : "bottom-0 right-0 -rotate-6",
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {/* combos */}
      {combos.length > 0 && (
        <section className="container-page below-fold mt-20 sm:mt-28" aria-labelledby="combos">
          <Reveal>
            <SectionHeading
              id="combos"
              eyebrow="Combos e kits"
              title="Sua semana resolvida"
              description="Kits com desconto para a família ou para a semana toda."
              href="/combos-e-promocoes"
              hrefLabel="Ver combos e promoções"
            />
          </Reveal>
          <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {combos.slice(0, 3).map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} defaultSize={ctx.defaultSize} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      )}

      {/* avaliações: só as reais (aprovadas, com comentário). Sem nenhuma, a seção não aparece.
          TODO(conteúdo): hoje nenhum fluxo cria avaliações (Review exige cliente com conta e o site
          não tem cadastro). Definir como coletar depoimentos reais antes de esperar esta seção. */}
      {reviews.length > 0 && (
        <section className="container-page below-fold mt-20 sm:mt-28" aria-labelledby="avaliacoes">
          <Reveal>
            <SectionHeading id="avaliacoes" eyebrow="Quem pediu, conta" title="Avaliações de clientes" />
          </Reveal>
          <StaggerGrid className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <StaggerItem key={r.id}>
                <figure className="flex h-full flex-col rounded-card border border-cream-300 bg-white p-6 shadow-soft">
                  <p className="flex gap-0.5" role="img" aria-label={`${r.rating} de 5 estrelas`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("size-4", i < r.rating ? "fill-tangerine text-tangerine" : "text-cream-300")} aria-hidden />
                    ))}
                  </p>
                  <blockquote className="mt-3 flex-1 text-ink/85">“{r.comment}”</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold text-forest">{r.user.name.split(" ")[0]}</span>
                    <span className="text-muted-foreground"> · {r.product.name}</span>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      )}

      {/* nossa cozinha */}
      {gallery.length > 0 && (
        <section className="container-page below-fold mt-20 grid items-center gap-10 sm:mt-28 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="cozinha">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">Nossa cozinha em Camburi</p>
            <h2 id="cozinha" className="mt-2 text-3xl font-semibold text-forest sm:text-5xl">Comida de casa, feita aqui no litoral</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">
              Cozinhamos todos os dias, em pequenas quantidades, pratos que lembram comida de casa. Do clássico arroz com
              feijão à moqueca caiçara.
            </p>
            <Link href="/sobre" className="group mt-6 inline-flex items-center gap-1.5 font-semibold text-forest hover:text-leaf-700">
              Conheça a nossa história <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
          <StaggerGrid className="grid auto-rows-[120px] grid-cols-2 gap-3 sm:auto-rows-[160px] sm:grid-cols-3">
            {gallery.map((g, i) => (
              <div key={g.src} className={cn(i === 0 && "row-span-2")}>
                <FoodImage
                  src={g.src}
                  blurDataURL={g.blur}
                  alt={g.alt}
                  seed={g.src}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="size-full rounded-card"
                  imgClassName="transition duration-700 hover:scale-105"
                />
              </div>
            ))}
          </StaggerGrid>
        </section>
      )}

      {/* área de entrega */}
      <Reveal className="container-page below-fold mt-20 sm:mt-28">
        <section aria-labelledby="entrega" className="grid gap-8 rounded-panel border border-cream-300 bg-white p-7 shadow-soft sm:p-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">Área de entrega</p>
            <h2 id="entrega" className="mt-2 text-3xl font-semibold text-forest sm:text-4xl">
              {zones.length ? "Onde a gente entrega" : "Retire na nossa cozinha"}
            </h2>
            <p className="mt-4 flex gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-5 shrink-0 text-leaf-700" aria-hidden /> Retirada: {settings.pickupAddress}
            </p>
            {settings.freeDeliveryMin != null && zones.length > 0 && (
              <p className="mt-3 inline-flex rounded-full bg-tangerine-100 px-3 py-1 text-sm font-semibold text-forest">
                Frete grátis acima de {formatBRL(settings.freeDeliveryMin)}
              </p>
            )}
          </div>
          {zones.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {zones.map((z) => (
                <li key={z.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3">
                  <span className="font-semibold text-forest">{z.district}</span>
                  <span className="text-right text-sm text-muted-foreground">
                    {z.fee === 0 ? "Grátis" : formatBRL(z.fee)}
                    <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap">
                      <Clock className="size-3.5" aria-hidden /> ~{z.etaMinutes} min
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>

      {/* perguntas frequentes */}
      <section className="container-page below-fold mt-20 grid gap-10 sm:mt-28 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq">
        <Reveal>
          <SectionHeading id="faq" eyebrow="Dúvidas" title="Perguntas frequentes" description="Não achou o que procurava? Fale com a gente pelo WhatsApp ou pela página de contato." />
        </Reveal>
        <Reveal>
          <div className="divide-y divide-cream-300 rounded-card border border-cream-300 bg-white">
            {faq.map((f) => (
              <details key={f.q} className="group px-5 sm:px-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-lg font-semibold text-forest">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 text-leaf-700 transition group-open:rotate-180" aria-hidden />
                </summary>
                <p className="-mt-1 pb-5 leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
