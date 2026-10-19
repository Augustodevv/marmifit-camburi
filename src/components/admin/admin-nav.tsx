"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Carrot,
  Cog,
  LayoutDashboard,
  Mail,
  Package,
  Ruler,
  Shuffle,
  Tags,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, owner: false },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package, owner: false },
  { href: "/admin/cardapio-do-dia", label: "Cardápio do dia", icon: CalendarDays, owner: false },
  { href: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed, owner: true },
  { href: "/admin/categorias", label: "Categorias", icon: Tags, owner: true },
  { href: "/admin/ingredientes", label: "Ingredientes", icon: Carrot, owner: true },
  { href: "/admin/tamanhos", label: "Tamanhos", icon: Ruler, owner: true },
  { href: "/admin/estilos-e-regras", label: "Estilos e regras", icon: Shuffle, owner: true },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket, owner: true },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, owner: true },
  { href: "/admin/mensagens", label: "Mensagens", icon: Mail, owner: false },
  { href: "/admin/configuracoes", label: "Entrega e horários", icon: Cog, owner: true },
];

export function AdminNav({ isOwner, pendingOrders }: { isOwner: boolean; pendingOrders: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.filter((i) => isOwner || !i.owner).map((i) => {
        const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-cream text-forest" : "text-cream/75 hover:bg-cream/10 hover:text-cream",
            )}
          >
            <i.icon className="size-4" aria-hidden />
            {i.label}
            {i.href === "/admin/pedidos" && pendingOrders > 0 && (
              <span className="ml-auto rounded-full bg-tangerine px-2 text-xs font-bold text-forest">{pendingOrders}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
