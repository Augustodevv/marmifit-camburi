import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/server/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/store/logo";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel Marmifit" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const pending = await db.order.count({ where: { status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } } });
  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <aside className="bg-forest p-4 text-cream lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:p-5">
        <div className="flex items-center justify-between lg:block">
          <Logo light />
          <p className="hidden text-xs text-cream/60 lg:mt-2 lg:block">Painel {user.role === "ADMIN" ? "do proprietário" : "da equipe"}</p>
        </div>
        <div className="mt-4 lg:mt-8">
          <AdminNav isOwner={user.role === "ADMIN"} pendingOrders={pending} />
        </div>
        <div className="mt-3 flex gap-1 border-t border-cream/10 pt-3 lg:mt-4 lg:block lg:space-y-1 lg:pt-4">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 hover:bg-cream/10">
            <ExternalLink className="size-4" aria-hidden /> Ver loja
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cream/75 hover:bg-cream/10">
              <LogOut className="size-4" aria-hidden /> Sair ({user.name.split(" ")[0]})
            </button>
          </form>
        </div>
      </aside>
      <main id="conteudo" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
