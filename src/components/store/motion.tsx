"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Surge de baixo para cima quando entra na tela. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};

/** Grade cujos filhos aparecem em cascata. */
export function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={container} initial={reduce ? false : "hidden"} whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={cn("h-full", className)} variants={item}>
      {children}
    </motion.div>
  );
}

/** Faixa de texto rolando sem parar. */
export function Marquee({ items, className, reverse }: { items: string[]; className?: string; reverse?: boolean }) {
  const reduce = useReducedMotion();
  const row = [...items, ...items];
  return (
    <div className={cn("relative flex overflow-hidden", className)} aria-hidden>
      <motion.div
        className="flex shrink-0 items-center gap-10 pr-10"
        animate={reduce ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            {t}
            <span className="text-[0.6em]">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/** Selo circular com texto girando. */
export function SpinningBadge({ text, className, children }: { text: string; className?: string; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative grid size-28 place-items-center", className)} aria-hidden>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 18, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[10.5px] font-bold uppercase tracking-[0.28em]">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </motion.svg>
      {children}
    </div>
  );
}
