"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomConfig } from "@/lib/pricing";

export type CartLine =
  | {
      key: string;
      type: "product";
      productId: string;
      sizeId: string | null;
      slug: string;
      name: string;
      image: string | null;
      sizeLabel: string | null;
      unitPrice: number;
      quantity: number;
      notes?: string;
    }
  | {
      key: string;
      type: "custom";
      config: CustomConfig;
      name: string;
      description: string;
      sizeLabel: string | null;
      unitPrice: number;
      quantity: number;
    };

type NewLine = CartLine extends infer L ? (L extends CartLine ? Omit<L, "key" | "quantity"> & { quantity?: number } : never) : never;

interface CartState {
  lines: CartLine[];
  /** incrementa a cada adição; usado para animar o ícone do carrinho */
  bump: number;
  add: (line: NewLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replaceAll: (lines: CartLine[]) => void;
}

function lineKey(line: NewLine): string {
  if (line.type === "product") return `p:${line.productId}:${line.sizeId ?? "-"}:${line.notes ?? ""}`;
  const c = line.config;
  const sorted = (a: string[]) => [...a].sort().join(",");
  return `c:${c.styleId}:${c.sizeId}:${sorted(c.proteinIds)}:${sorted(c.extraProteinIds)}:${sorted(c.baseIds)}:${sorted(c.sideIds)}:${sorted(c.addonIds)}:${c.notes ?? ""}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      bump: 0,
      add: (line) =>
        set((state) => {
          const key = lineKey(line);
          const qty = line.quantity ?? 1;
          const existing = state.lines.find((l) => l.key === key);
          const lines = existing
            ? state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + qty) } : l))
            : [...state.lines, { ...line, key, quantity: qty } as CartLine];
          return { lines, bump: state.bump + 1 };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(50, quantity)) } : l)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      replaceAll: (lines) => set((state) => ({ lines, bump: state.bump + 1 })),
    }),
    {
      name: "marmifit-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
}

/** Converte as linhas para o formato aceito pela API (sem preços). */
export function toApiItems(lines: CartLine[]) {
  return lines.map((l) =>
    l.type === "product"
      ? { type: "product" as const, productId: l.productId, sizeId: l.sizeId, quantity: l.quantity, notes: l.notes }
      : { type: "custom" as const, config: l.config, quantity: l.quantity },
  );
}
