"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Menu, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { SearchDialog } from "@/components/store/search-dialog";
import { useCart, cartCount } from "@/components/store/cart-store";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";

const NAV = [
  { href: "/cardapio", label: "Cardápio" },
  { href: "/monte-sua-marmita", label: "Monte a sua" },
  { href: "/marmitas-do-dia", label: "Do dia" },
  { href: "/combos-e-promocoes", label: "Combos e promoções" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const bump = useCart((s) => s.bump);
  const mounted = useHydrated();
  const [open, setOpen] = useState(false);
  const controls = useAnimationControls();
  const count = mounted ? cartCount(lines) : 0;

  useEffect(() => {
    if (bump > 0) controls.start({ scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 6, 0], transition: { duration: 0.5 } });
  }, [bump, controls]);

  const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300/70 bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
        <Logo />
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium text-forest/80 transition-colors hover:bg-cream-200 hover:text-forest",
                  active && "bg-forest text-cream hover:bg-forest hover:text-cream",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchDialog />
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden size-10 items-center justify-center rounded-full text-forest hover:bg-cream-200 sm:flex"
              aria-label="Painel administrativo"
              title="Painel administrativo"
            >
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <Link
            href={user ? "/conta" : "/entrar"}
            className="flex h-10 items-center gap-2 rounded-full px-2.5 text-sm font-medium text-forest hover:bg-cream-200"
            aria-label={user ? "Minha conta" : "Entrar"}
          >
            <User className="size-5" />
            <span className="hidden max-w-28 truncate md:inline">{user ? user.name.split(" ")[0] : "Entrar"}</span>
          </Link>
          <motion.div animate={controls}>
            <Link
              href="/carrinho"
              className="relative flex h-10 items-center gap-2 rounded-full bg-forest pl-3 pr-4 text-sm font-semibold text-cream shadow-soft transition hover:bg-forest-800"
              aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
            >
              <ShoppingBag className="size-[18px]" />
              <span aria-hidden>{count}</span>
            </Link>
          </motion.div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-cream-200 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] bg-cream p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
              <nav aria-label="Menu móvel" className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 font-display text-lg text-forest hover:bg-cream-200"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/acompanhar" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-display text-lg text-forest hover:bg-cream-200">
                  Acompanhar pedido
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-display text-lg text-leaf hover:bg-cream-200">
                    Painel administrativo
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
