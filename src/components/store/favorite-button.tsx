"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { toggleFavorite } from "@/server/actions/store";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  initial,
  loggedIn,
  className,
}: {
  productId: string;
  initial: boolean;
  loggedIn: boolean;
  className?: string;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!loggedIn) {
          toast("Entre na sua conta para salvar favoritos.", {
            action: { label: "Entrar", onClick: () => router.push(`/entrar?next=${encodeURIComponent(location.pathname)}`) },
          });
          return;
        }
        setFav((v) => !v);
        start(async () => {
          const r = await toggleFavorite(productId);
          if (!r.ok) {
            setFav((v) => !v);
            toast.error(r.message);
          } else {
            setFav(Boolean(r.favorite));
            toast.success(r.favorite ? "Salvo nos favoritos" : "Removido dos favoritos");
          }
        });
      }}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-white/90 text-forest shadow-soft backdrop-blur transition hover:bg-white",
        className,
      )}
    >
      <Heart className={cn("size-5 transition", fav && "fill-tangerine text-tangerine")} />
    </motion.button>
  );
}
