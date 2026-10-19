"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/store/cart-store";
import { Button } from "@/components/ui/button";
import { formatBRL, productPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface SizeOpt {
  id: string;
  name: string;
  grams: number;
  priceMultiplier: number;
}

export function ProductPurchase({
  product,
  sizes,
  defaultSizeId,
  blockedReason,
  notice,
}: {
  product: { id: string; slug: string; name: string; image: string | null; basePrice: number; hasSizes: boolean; compareAtPrice: number | null };
  sizes: SizeOpt[];
  defaultSizeId: string | null;
  blockedReason: string | null;
  notice?: string | null;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [sizeId, setSizeId] = useState(defaultSizeId);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const unit = productPrice(product, product.hasSizes ? size : null);

  function addToCart(goToCart: boolean) {
    add({
      type: "product",
      productId: product.id,
      sizeId: product.hasSizes ? sizeId : null,
      slug: product.slug,
      name: product.name,
      image: product.image,
      sizeLabel: product.hasSizes && size ? `${size.name} (${size.grams} g)` : null,
      unitPrice: unit,
      quantity: qty,
      notes: notes.trim() || undefined,
    });
    toast.success(`${qty}x ${product.name} no carrinho`, {
      action: { label: "Ver carrinho", onClick: () => router.push("/carrinho") },
    });
    if (goToCart) router.push("/carrinho");
  }

  return (
    <div className="space-y-6">
      {product.hasSizes && (
        <fieldset>
          <legend className="text-sm font-bold text-forest">Tamanho</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sizes.map((s) => {
              const selected = s.id === sizeId;
              return (
                <label
                  key={s.id}
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 bg-white p-3 text-center transition",
                    selected ? "border-leaf shadow-soft" : "border-cream-300 hover:border-leaf/50",
                  )}
                >
                  <input type="radio" name="size" value={s.id} checked={selected} onChange={() => setSizeId(s.id)} className="sr-only" />
                  <span className="block text-sm font-bold text-forest">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">{s.grams} g</span>
                  <span className="mt-1 block text-sm font-semibold text-leaf">{formatBRL(productPrice(product, s))}</span>
                  {selected && <motion.span layoutId="size-ring" className="absolute inset-0 rounded-xl ring-2 ring-leaf/30" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="notes" className="text-sm font-bold text-forest">
          Observações <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="Ex.: sem cebola, molho à parte, alergia a..."
          className="mt-2 w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 items-center rounded-xl border border-input bg-white">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-12 items-center justify-center text-forest hover:text-leaf" aria-label="Diminuir quantidade">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite" aria-label={`Quantidade: ${qty}`}>
            {qty}
          </span>
          <button type="button" onClick={() => setQty((q) => Math.min(50, q + 1))} className="flex size-12 items-center justify-center text-forest hover:text-leaf" aria-label="Aumentar quantidade">
            <Plus className="size-4" />
          </button>
        </div>
        <Button size="xl" className="flex-1" disabled={!!blockedReason || (product.hasSizes && !size)} onClick={() => addToCart(false)}>
          <ShoppingBag className="size-5" aria-hidden />
          Adicionar · {formatBRL(unit * qty)}
        </Button>
      </div>
      {notice && !blockedReason && <p className="rounded-xl bg-tangerine-100 p-3 text-sm font-medium text-forest">{notice}</p>}
      {blockedReason ? (
        <p className="rounded-xl bg-tangerine-100 p-3 text-sm font-medium text-forest">{blockedReason}</p>
      ) : (
        <button type="button" onClick={() => addToCart(true)} className="text-sm font-semibold text-leaf underline-offset-4 hover:underline">
          Adicionar e ir para o carrinho
        </button>
      )}
    </div>
  );
}
