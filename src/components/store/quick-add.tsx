"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/store/cart-store";
import { cn } from "@/lib/utils";

type ProductLine = Omit<Extract<CartLine, { type: "product" }>, "key" | "quantity">;

/** Botão "Adicionar" dos cards: troca para "Adicionado" com um pulso, além do toast e do pulo do carrinho. */
export function QuickAdd({ line }: { line: ProductLine }) {
  const add = useCart((s) => s.add);
  const reduce = useReducedMotion();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(0), 1400);
    return () => window.clearTimeout(id);
  }, [done]);

  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.92 }}
      onClick={() => {
        add(line);
        setDone((n) => n + 1);
        toast.success(`${line.name} no carrinho`, { description: line.sizeLabel ?? undefined });
      }}
      className={cn(
        "relative z-10 flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold shadow-soft transition-colors duration-300",
        done ? "bg-leaf-700 text-white" : "bg-tangerine text-forest hover:bg-[#f7ad5f]",
      )}
      aria-label={`Adicionar ${line.name} ao carrinho`}
    >
      {done > 0 && !reduce && (
        <motion.span
          key={done}
          aria-hidden
          className="absolute inset-0 rounded-full bg-leaf-700"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="ok" className="flex items-center gap-1.5" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Check className="size-4" strokeWidth={3} aria-hidden /> Adicionado
          </motion.span>
        ) : (
          <motion.span key="add" className="flex items-center gap-1.5" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Plus className="size-4" strokeWidth={3} aria-hidden /> Adicionar
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
