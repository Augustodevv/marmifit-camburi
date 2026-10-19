"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/store/cart-store";
import { Button } from "@/components/ui/button";
import type { CustomConfig } from "@/lib/pricing";

export interface ReorderItem {
  name: string;
  sizeName: string | null;
  description: string | null;
  unitPrice: number;
  quantity: number;
  notes: string | null;
  configuration: unknown;
  product: { slug: string; image: string | null; active: boolean } | null;
}

/** Recoloca os itens de um pedido antigo no carrinho; os preços são reconferidos no carrinho. */
export function ReorderButton({ items }: { items: ReorderItem[] }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  return (
    <Button
      size="lg"
      variant="accent"
      onClick={() => {
        let added = 0;
        for (const it of items) {
          const cfg = it.configuration as Record<string, unknown> | null;
          if (!cfg) continue;
          if ("styleId" in cfg) {
            add({ type: "custom", config: cfg as unknown as CustomConfig, name: it.name, description: it.description ?? "", sizeLabel: it.sizeName, unitPrice: it.unitPrice, quantity: it.quantity });
            added++;
          } else if ("productId" in cfg && it.product?.active) {
            add({
              type: "product",
              productId: String(cfg.productId),
              sizeId: (cfg.sizeId as string | null) ?? null,
              slug: it.product.slug,
              name: it.name,
              image: it.product.image,
              sizeLabel: it.sizeName,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              notes: it.notes ?? undefined,
            });
            added++;
          }
        }
        if (added === 0) {
          toast.error("Os itens deste pedido não estão mais disponíveis.");
          return;
        }
        toast.success("Itens adicionados ao carrinho", { description: "Conferimos preços e disponibilidade atuais." });
        router.push("/carrinho");
      }}
    >
      <RotateCcw className="size-4" aria-hidden /> Pedir novamente
    </Button>
  );
}
