import { Lock, Radar, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/** Garantias reais do fluxo de pedido (ver README: recálculo no servidor, pedido sem cadastro, rastreio). */
const ITEMS = [
  { icon: Lock, text: "Preços e cupons conferidos no servidor" },
  { icon: UserRound, text: "Sem cadastro: só nome e telefone" },
  { icon: Radar, text: "Acompanhe o pedido pelo site" },
];

export function TrustList({ className }: { className?: string }) {
  return (
    <ul className={cn("space-y-2 text-xs text-muted-foreground", className)}>
      {ITEMS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-leaf-700" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}
