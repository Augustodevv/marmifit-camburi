"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ActionState } from "@/server/actions/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, orderId, orderNumber }: { productId: string; orderId: string; orderNumber: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);

  if (state?.ok) return <p className="rounded-xl bg-leaf-100 p-4 text-sm font-semibold text-forest">{state.message}</p>;

  return (
    <form action={action} className="rounded-2xl border border-cream-300 bg-white p-5">
      <p className="text-sm font-semibold text-forest">Avalie este prato (pedido {orderNumber})</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
          >
            <Star className={cn("size-7 transition", n <= rating ? "fill-tangerine text-tangerine" : "text-cream-300")} />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        maxLength={600}
        placeholder="Conte o que achou (opcional)"
        className="mt-3 w-full rounded-xl border border-input p-3 text-sm outline-none focus:border-leaf"
      />
      {state && !state.ok && <p className="mt-2 text-sm text-destructive">{state.message}</p>}
      <Button type="submit" size="lg" className="mt-3" disabled={pending || rating === 0}>
        {pending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </form>
  );
}
