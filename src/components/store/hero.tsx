"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bike, CalendarClock, ShieldCheck, Sparkles } from "lucide-react";
import { FoodImage } from "@/components/store/food-image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Hero({
  heroImage,
  fromPrice,
  isOpen,
}: {
  heroImage: string | null;
  fromPrice: string;
  isOpen: boolean;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-leaf/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[380px] rounded-full bg-tangerine/20 blur-3xl" aria-hidden />
      <div className="container-page relative grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
        <div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-white/70 px-3 py-1.5 text-xs font-semibold text-leaf"
          >
            <span className={cn("size-2 rounded-full", isOpen ? "bg-leaf animate-pulse" : "bg-tangerine")} aria-hidden />
            {isOpen ? "Cozinha aberta — pedidos saindo agora" : "Cozinha fechada — agende seu pedido"}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-5 text-[2.6rem] font-semibold leading-[1.02] text-forest sm:text-6xl lg:text-7xl"
          >
            Comida de verdade,
            <span className="relative block italic text-leaf">
              do seu jeito.
              <svg viewBox="0 0 300 20" className="absolute -bottom-2 left-0 h-4 w-[70%] text-tangerine" aria-hidden>
                <motion.path
                  d="M2 14 C 80 2, 180 2, 298 12"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
                />
              </svg>
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
            Marmitas feitas todos os dias em Camburi: tradicionais, fitness, low carb, vegetarianas e veganas. Escolha pronta
            ou monte a sua, com preço calculado na hora.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
            <Link href="/cardapio" className={buttonVariants({ size: "xl" })}>
              Ver cardápio <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/monte-sua-marmita" className={buttonVariants({ size: "xl", variant: "accent" })}>
              <Sparkles className="size-5" aria-hidden /> Monte a sua
            </Link>
          </motion.div>
          <motion.ul
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-10 grid max-w-xl grid-cols-1 gap-3 text-sm text-forest sm:grid-cols-3"
          >
            <li className="flex items-center gap-2"><Bike className="size-5 text-leaf" aria-hidden /> Entrega em Camburi e região</li>
            <li className="flex items-center gap-2"><CalendarClock className="size-5 text-leaf" aria-hidden /> Agende até 7 dias</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-leaf" aria-hidden /> Pix ou cartão seguro</li>
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <FoodImage
            src={heroImage}
            alt="Marmita colorida com arroz, feijão, salada e frango grelhado"
            seed="hero-marmifit"
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/5] w-full rounded-[2.5rem] shadow-lift sm:aspect-square"
          />
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{ delay: 0.8, duration: 0.6, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
            className="absolute -left-3 bottom-10 rounded-2xl bg-white p-4 shadow-lift sm:-left-8"
          >
            <p className="text-xs text-muted-foreground">Monte a sua a partir de</p>
            <p className="font-display text-2xl font-semibold text-forest">{fromPrice}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
            transition={{ delay: 1, duration: 0.6, y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
            className="absolute -right-2 top-10 flex items-center gap-3 rounded-2xl bg-forest p-3 pr-4 text-cream shadow-lift sm:-right-6"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-tangerine text-forest">
              <Bike className="size-5" aria-hidden />
            </span>
            <span className="text-sm leading-tight">
              <span className="block font-semibold">Acompanhe ao vivo</span>
              <span className="text-cream/70">do preparo à sua porta</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
