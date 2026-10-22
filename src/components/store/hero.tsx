"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Bike, CalendarClock, ShieldCheck, Sparkles, Star } from "lucide-react";
import { SpinningBadge } from "@/components/store/motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WORDS = ["caseira", "fitness", "low carb", "vegana", "do seu jeito"];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.1 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Hero({
  heroImage,
  sideImage,
  fromPrice,
  isOpen,
}: {
  heroImage: string | null;
  sideImage: string | null;
  fromPrice: string;
  isOpen: boolean;
}) {
  const reduce = useReducedMotion();
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, [reduce]);

  // inclinação 3D da foto acompanhando o mouse
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 14 });

  return (
    <section className="relative isolate overflow-hidden bg-forest text-cream">
      {/* blobs animados */}
      <motion.div
        aria-hidden
        className="absolute -left-32 -top-32 -z-10 size-[520px] rounded-full bg-leaf/50 blur-3xl"
        animate={reduce ? undefined : { x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 right-0 -z-10 size-[560px] rounded-full bg-tangerine/40 blur-3xl"
        animate={reduce ? undefined : { x: [0, -90, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#F8F5ED_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="container-page relative grid items-center gap-14 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/10 px-3.5 py-1.5 text-xs font-semibold text-cream backdrop-blur"
          >
            <span className="relative flex size-2.5">
              {isOpen && <span className="absolute inline-flex size-full animate-ping rounded-full bg-tangerine opacity-75" />}
              <span className={cn("relative inline-flex size-2.5 rounded-full", isOpen ? "bg-tangerine" : "bg-cream/50")} />
            </span>
            {isOpen ? "Cozinha aberta — faça seu pedido" : "Pedidos pausados no momento"}
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 text-[2.9rem] font-semibold leading-[0.98] sm:text-7xl lg:text-[5.4rem]"
          >
            Comida de verdade,
            <span className="mt-2 block h-[1.1em] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={WORDS[word]}
                  initial={{ y: "100%", opacity: 0, rotate: 4 }}
                  animate={{ y: "0%", opacity: 1, rotate: 0 }}
                  exit={{ y: "-100%", opacity: 0, rotate: -4 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="block bg-gradient-to-r from-tangerine via-[#ffc27a] to-[#9fd8a4] bg-clip-text italic text-transparent"
                >
                  {WORDS[word]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
            Marmitas feitas todos os dias em Camburi, no Litoral Norte de SP. Escolha pronta ou monte a sua, com preço
            calculado na hora e entrega na sua porta.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-9 flex flex-wrap gap-3">
            <Link href="/monte-sua-marmita" className={cn(buttonVariants({ size: "xl", variant: "accent" }), "group relative overflow-hidden")}>
              <span className="absolute inset-0 -translate-x-full bg-white/40 transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
              <Sparkles className="size-5" aria-hidden /> Monte a sua
            </Link>
            <Link href="/cardapio" className={cn(buttonVariants({ size: "xl", variant: "cream" }), "group")}>
              Ver cardápio <ArrowRight className="size-5 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </motion.div>

          <motion.ul variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-10 grid max-w-xl grid-cols-1 gap-3 text-sm text-cream/85 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Bike className="size-5 text-tangerine" aria-hidden /> Entrega na Costa Sul</li>
            <li className="flex items-center gap-2"><CalendarClock className="size-5 text-tangerine" aria-hidden /> Agende até 7 dias</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-tangerine" aria-hidden /> Pix ou cartão seguro</li>
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[580px] [perspective:1200px]"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onMouseLeave={() => {
            mx.set(0);
            my.set(0);
          }}
        >
          <motion.div style={reduce ? undefined : { rotateX: rx, rotateY: ry }} className="relative [transform-style:preserve-3d]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] border-4 border-cream/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
              {heroImage ? (
                <Image src={heroImage} alt="Prato da Marmifit Camburi" fill priority quality={90} sizes="(min-width: 1024px) 580px, 100vw" className="object-cover" />
              ) : (
                <div className="size-full bg-leaf" />
              )}
            </div>

            {sideImage && (
              <motion.div
                initial={{ opacity: 0, x: -40, rotate: -12 }}
                animate={{ opacity: 1, x: 0, rotate: -8, y: reduce ? 0 : [0, -12, 0] }}
                transition={{ delay: 0.7, duration: 0.8, y: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
                className="absolute -bottom-8 -left-6 w-40 overflow-hidden rounded-3xl border-4 border-cream shadow-2xl sm:-left-12 sm:w-52 [transform:translateZ(60px)]"
              >
                <div className="relative aspect-[4/3]">
                  <Image src={sideImage} alt="" fill quality={90} sizes="208px" className="object-cover" />
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: reduce ? 0 : [0, 10, 0] }}
              transition={{ delay: 0.9, duration: 0.6, y: { repeat: Infinity, duration: 6, ease: "easeInOut" } }}
              className="absolute -right-3 top-8 rounded-2xl bg-cream p-4 text-forest shadow-2xl sm:-right-8 [transform:translateZ(80px)]"
            >
              <p className="text-xs font-semibold text-muted-foreground">Monte a sua a partir de</p>
              <p className="font-display text-3xl font-semibold">{fromPrice}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-leaf">
                <Star className="size-3.5 fill-tangerine text-tangerine" aria-hidden /> preço na hora
              </p>
            </motion.div>

            <SpinningBadge text="feito hoje • camburi • litoral norte • " className="absolute -bottom-6 right-6 text-tangerine sm:right-10 [transform:translateZ(70px)]">
              <span className="grid size-16 place-items-center rounded-full bg-tangerine text-forest shadow-xl">
                <Bike className="size-7" />
              </span>
            </SpinningBadge>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
