"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Minus, Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCart, cartSubtotal, toApiItems, type CartLine } from "@/components/store/cart-store";
import { FoodImage } from "@/components/store/food-image";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { TrustList } from "@/components/store/trust-list";

/** Sincroniza preços do carrinho com o servidor e devolve erros por linha. */
export function useCartValidation() {
  const lines = useCart((s) => s.lines);
  const replaceAll = useCart((s) => s.replaceAll);
  const [result, setResult] = useState<{ sig: string; errors: Record<string, string> }>({ sig: "", errors: {} });
  const signature = lines.map((l) => `${l.key}x${l.quantity}`).join("|");

  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: toApiItems(lines) }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { lines: { index: number; unitPrice: number; error: string | null }[] }) => {
        if (cancelled) return;
        const errs: Record<string, string> = {};
        let changed = false;
        const updated = lines.map((l, i) => {
          const q = data.lines.find((x) => x.index === i);
          if (!q) return l;
          if (q.error) errs[l.key] = q.error;
          if (q.unitPrice !== l.unitPrice && !q.error) {
            changed = true;
            return { ...l, unitPrice: q.unitPrice } as CartLine;
          }
          return l;
        });
        setResult({ sig: signature, errors: errs });
        if (changed) {
          replaceAll(updated);
          toast("Atualizamos os preços do carrinho", { description: "Os valores foram conferidos com o cardápio atual." });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setResult({ sig: signature, errors: {} });
        toast.error("Não foi possível conferir o carrinho agora.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const empty = lines.length === 0;
  return { errors: empty ? {} : result.errors, checking: !empty && result.sig !== signature };
}

export function CartView() {
  const { lines, setQuantity, remove, clear } = useCart();
  const mounted = useHydrated();
  const { errors, checking } = useCartValidation();

  if (!mounted) {
    return (
      <div className="container-page grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-card bg-cream-200" />)}</div>
        <Skeleton className="h-72 rounded-panel bg-cream-200" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex size-24 items-center justify-center rounded-full bg-cream-200">
          <ShoppingBag className="size-10 text-leaf-700" aria-hidden />
        </motion.div>
        <h1 className="mt-6 text-4xl font-semibold text-forest">Seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">Bora escolher algo gostoso?</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/cardapio" className={buttonVariants({ size: "xl" })}>Ver cardápio</Link>
          <Link href="/monte-sua-marmita" className={buttonVariants({ size: "xl", variant: "accent" })}>
            <Sparkles className="size-5" aria-hidden /> Montar a minha
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="container-page grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-labelledby="cart-title">
        <div className="flex items-end justify-between">
          <h1 id="cart-title" className="text-4xl font-semibold text-forest">Carrinho</h1>
          <button
            onClick={() => {
              const backup = lines;
              clear();
              toast("Carrinho esvaziado", { action: { label: "Desfazer", onClick: () => useCart.getState().replaceAll(backup) } });
            }}
            className="text-sm font-semibold text-muted-foreground hover:text-destructive"
          >
            Esvaziar
          </button>
        </div>
        <ul className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li
                key={l.key}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, height: 0, marginTop: 0 }}
                className={cn("flex gap-4 rounded-card border bg-white p-4 shadow-soft", errors[l.key] ? "border-destructive/50" : "border-cream-300")}
              >
                {l.type === "product" ? (
                  <Link href={`/cardapio/${l.slug}`} className="shrink-0">
                    <FoodImage src={l.image} alt={l.name} seed={l.slug} sizes="96px" className="size-20 rounded-xl sm:size-24" />
                  </Link>
                ) : (
                  <FoodImage alt={l.name} seed={l.key} sizes="96px" className="size-20 shrink-0 rounded-xl sm:size-24" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-forest">{l.name}</p>
                      {l.sizeLabel && <p className="text-xs text-muted-foreground">{l.sizeLabel}</p>}
                      {l.type === "custom" && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{l.description}</p>}
                      {l.type === "product" && l.notes && <p className="mt-1 text-xs italic text-muted-foreground">Obs.: {l.notes}</p>}
                      {l.type === "custom" && l.config.notes && <p className="mt-1 text-xs italic text-muted-foreground">Obs.: {l.config.notes}</p>}
                    </div>
                    <button onClick={() => remove(l.key)} className="h-fit rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remover ${l.name}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {errors[l.key] && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {errors[l.key]}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex h-9 items-center rounded-lg border border-input">
                      <button onClick={() => setQuantity(l.key, l.quantity - 1)} disabled={l.quantity <= 1} className="flex size-9 items-center justify-center disabled:opacity-40" aria-label="Diminuir">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.quantity}</span>
                      <button onClick={() => setQuantity(l.key, l.quantity + 1)} className="flex size-9 items-center justify-center" aria-label="Aumentar">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="font-display text-lg font-semibold text-forest tabular-nums">{formatBRL(l.unitPrice * l.quantity)}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <Link href="/cardapio" className="mt-6 inline-block text-sm font-semibold text-leaf-700 hover:underline">
          + Adicionar mais itens
        </Link>
      </section>

      <aside>
        <div className="sticky top-24 rounded-panel border border-cream-300 bg-white p-6 shadow-lift">
          <h2 className="text-2xl font-semibold text-forest">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{checking ? <Skeleton className="h-4 w-16" /> : formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Entrega e cupons</dt>
              <dd>calculados no checkout</dd>
            </div>
          </dl>
          {hasErrors && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">Remova ou ajuste os itens destacados para continuar.</p>}
          <Link
            href="/checkout"
            aria-disabled={hasErrors || checking}
            className={cn(buttonVariants({ size: "xl", variant: "accent" }), "mt-6 w-full", (hasErrors || checking) && "pointer-events-none opacity-50")}
          >
            Finalizar pedido <ArrowRight className="size-5" aria-hidden />
          </Link>
          <TrustList className="mt-5 border-t border-cream-300 pt-4" />
        </div>
      </aside>
    </div>
  );
}
