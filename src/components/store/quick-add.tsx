"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/store/cart-store";

type ProductLine = Omit<Extract<CartLine, { type: "product" }>, "key" | "quantity">;

export function QuickAdd({ line }: { line: ProductLine }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        add(line);
        setDone(true);
        toast.success(`${line.name} no carrinho`, { description: line.sizeLabel ?? undefined });
        setTimeout(() => setDone(false), 1200);
      }}
      className="relative z-10 flex size-11 items-center justify-center rounded-full bg-tangerine text-forest shadow-soft transition hover:bg-[#f7ad5f]"
      aria-label={`Adicionar ${line.name} ao carrinho`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="ok" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
            <Check className="size-5" strokeWidth={3} />
          </motion.span>
        ) : (
          <motion.span key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Plus className="size-5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
