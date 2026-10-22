import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles, Star } from "lucide-react";
import { HeroVideo } from "@/components/store/hero-video";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Hero de tela cheia: vídeo (ou foto) de fundo, gradiente para leitura e as duas chamadas principais. */
export function Hero({
  heroImage,
  heroVideo,
  fromPrice,
  isOpen,
}: {
  heroImage: string | null;
  heroVideo: string | null;
  fromPrice: string;
  isOpen: boolean;
}) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4rem)] overflow-hidden bg-forest text-cream lg:min-h-[calc(100svh-72px)]">
      <HeroVideo poster={heroImage} videoUrl={heroVideo} alt="Marmitas recém-preparadas na cozinha da Marmifit em Camburi" className="-z-20" />

      {/* gradientes: garantem contraste do texto claro sobre qualquer quadro do vídeo */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-forest via-forest/80 to-forest/10 lg:via-forest/40" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-forest/95 via-forest/60 to-transparent lg:block" />

      <div className="container-page relative flex flex-col justify-end pb-10 pt-24 sm:pb-14 lg:justify-center lg:pb-24">
        <div className="max-w-2xl animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-forest/50 px-3.5 py-1.5 text-xs font-semibold backdrop-blur">
            <span className="relative flex size-2.5">
              {isOpen && <span className="absolute inline-flex size-full animate-ping rounded-full bg-tangerine opacity-75 motion-reduce:animate-none" />}
              <span className={cn("relative inline-flex size-2.5 rounded-full", isOpen ? "bg-tangerine" : "bg-cream/50")} />
            </span>
            {isOpen ? "Cozinha aberta — faça seu pedido" : "Pedidos pausados no momento"}
          </p>

          <h1 id="hero-title" className="mt-5 text-[2.75rem] font-semibold leading-[0.98] text-balance drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)] sm:text-7xl lg:text-[5.5rem]">
            Comida de verdade,{" "}
            <span className="block italic text-tangerine">caseira.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/90 sm:text-xl">
            Marmitas feitas todos os dias em Camburi, no Litoral Norte de SP. Escolha pronta ou monte a sua, com preço
            calculado na hora e entrega na sua porta.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/monte-sua-marmita" className={cn(buttonVariants({ size: "xl", variant: "accent" }), "group justify-center")}>
              <Sparkles className="size-5 transition group-hover:rotate-12" aria-hidden /> Monte a sua
            </Link>
            <Link
              href="/cardapio"
              className={cn(buttonVariants({ size: "xl", variant: "outline" }), "group justify-center border-cream/40 bg-cream/10 text-cream backdrop-blur hover:bg-cream hover:text-forest")}
            >
              Ver cardápio <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-24 right-8 hidden rounded-card border border-cream/15 bg-forest/60 p-5 shadow-float backdrop-blur-md xl:block">
          <p className="text-xs font-semibold text-cream/80">Monte a sua a partir de</p>
          <p className="font-display text-4xl font-semibold">{fromPrice}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-tangerine">
            <Star className="size-3.5 fill-tangerine" aria-hidden /> preço calculado na hora
          </p>
        </div>

        <a
          href="#beneficios"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-cream/80 hover:text-cream lg:flex"
        >
          Role para ver mais <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
        </a>
      </div>
    </section>
  );
}
