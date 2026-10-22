"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/store/cart-store";
import { cn } from "@/lib/utils";

type ProductLine = Omit<Extract<CartLine, { type: "product" }>, "key" | "quantity">;

/**
 * Botão "Adicionar" dos cards: troca para "Adicionado" com um pulso, além do toast
 * e do pulo do carrinho. Animações em CSS (sem framer-motion na home e no cardápio).
 */
export function QuickAdd({ line }: { line: ProductLine }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(0), 1400);
    return () => window.clearTimeout(id);
  }, [done]);

  return (
    <button
      type="button"
      onClick={() => {
        add(line);
        setDone((n) => n + 1);
        toast.success(`${line.name} no carrinho`, { description: line.sizeLabel ?? undefined });
      }}
      className={cn(
        "relative z-10 flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold shadow-soft transition duration-300 active:scale-95",
        done ? "bg-leaf-700 text-white" : "bg-tangerine text-forest hover:bg-[#f7ad5f]",
      )}
      aria-label={`Adicionar ${line.name} ao carrinho`}
    >
      {done > 0 && <span key={done} aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-leaf-700" />}
      {done ? (
        <span key="ok" className="relative flex animate-pop-in items-center gap-1.5">
          <Check className="size-4" strokeWidth={3} aria-hidden /> Adicionado
        </span>
      ) : (
        <span key="add" className="relative flex items-center gap-1.5">
          <Plus className="size-4" strokeWidth={3} aria-hidden /> Adicionar
        </span>
      )}
    </button>
  );
}
