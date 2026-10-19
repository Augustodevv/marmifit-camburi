import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Gift, Heart, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/server/actions/auth";
import { deleteAccount } from "@/server/actions/account";
import { ProductCard } from "@/components/store/product-card";
import { ReorderButton } from "@/components/store/reorder-button";
import { AddressActions, AddressForm, MarkReadButton, ProfileForm } from "@/components/store/account-forms";
import { Button, buttonVariants } from "@/components/ui/button";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/hours";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { listProducts, getSettings } from "@/server/catalog";
import { getListingContext } from "@/server/viewer";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

const TABS = [
  { id: "pedidos", label: "Pedidos", icon: Package },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "pontos", label: "Fidelidade", icon: Gift },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "dados", label: "Meus dados", icon: UserRound },
];

export default async function AccountPage({ searchParams }: PageProps<"/conta">) {
  const user = await requireUser("/conta");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.aba) ? (sp.aba as string) : "pedidos";
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">Minha conta</p>
          <h1 className="mt-1 text-4xl font-semibold text-forest">Olá, {user.name.split(" ")[0]}!</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-tangerine px-4 py-2 text-sm font-bold text-forest">{user.loyaltyPoints} pontos</span>
          <form action={logout}>
            <Button variant="outline" size="lg" type="submit"><LogOut className="size-4" aria-hidden /> Sair</Button>
          </form>
        </div>
      </div>

      <nav aria-label="Seções da conta" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/conta?aba=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-forest text-cream" : "bg-white text-forest hover:bg-cream-200",
            )}
          >
            <t.icon className="size-4" aria-hidden /> {t.label}
            {t.id === "notificacoes" && unread > 0 && <span className="rounded-full bg-tangerine px-1.5 text-xs text-forest">{unread}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "pedidos" && <Orders userId={user.id} />}
        {tab === "favoritos" && <Favorites userId={user.id} />}
        {tab === "enderecos" && <Addresses userId={user.id} />}
        {tab === "pontos" && <Loyalty points={user.loyaltyPoints} userId={user.id} />}
        {tab === "notificacoes" && <Notifications userId={user.id} />}
        {tab === "dados" && (
          <div className="max-w-2xl space-y-8">
            <ProfileForm name={user.name} phone={user.phone ?? ""} />
            <p className="text-sm text-muted-foreground">E-mail: {user.email}</p>
            {user.role === "CUSTOMER" && (
              <form action={deleteAccount} className="rounded-2xl border border-destructive/30 bg-white p-5">
                <h2 className="font-sans text-sm font-bold text-destructive">Excluir minha conta</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Removemos sua conta, endereços, favoritos e avaliações. Pedidos antigos ficam anonimizados para fins fiscais. Digite EXCLUIR para confirmar.
                </p>
                {sp.erro === "confirmacao" && <p className="mt-2 text-sm text-destructive">Digite EXCLUIR exatamente para confirmar.</p>}
                <div className="mt-3 flex gap-2">
                  <input name="confirm" aria-label="Confirmação" className="h-10 rounded-xl border border-input px-3 text-sm" />
                  <Button type="submit" variant="destructive" size="lg">Excluir conta</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

async function Orders({ userId }: { userId: string }) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { items: { include: { product: { select: { slug: true, image: true, active: true } } } } },
  });
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-12 text-center">
        <p className="font-display text-2xl text-forest">Você ainda não fez pedidos.</p>
        <Link href="/cardapio" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>Ver cardápio</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-col gap-4 rounded-2xl border border-cream-300 bg-white p-5 shadow-soft sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-forest">{o.number}</p>
              <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-semibold text-leaf">{ORDER_STATUS_LABEL[o.status]}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} itens · {formatBRL(o.total)}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
            {o.status === "DELIVERED" && o.items.some((i) => i.product) && (
              <p className="mt-2 text-xs">
                Avalie:{" "}
                {o.items.filter((i) => i.product).map((i, idx) => (
                  <span key={i.id}>
                    {idx > 0 && " · "}
                    <Link href={`/cardapio/${i.product!.slug}#avaliacoes`} className="font-semibold text-leaf underline">{i.name}</Link>
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/pedido/${o.number}?t=${o.trackingToken}`} className={buttonVariants({ variant: "outline", size: "lg" })}>Detalhes</Link>
            <ReorderButton items={o.items} />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Favorites({ userId }: { userId: string }) {
  const [products, ctx] = await Promise.all([listProducts({ favorites: { some: { userId } } }), getListingContext()]);
  if (products.length === 0) {
    return <p className="rounded-2xl border border-dashed border-cream-300 bg-white p-12 text-center text-muted-foreground">Toque no coração dos pratos para salvá-los aqui.</p>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} defaultSize={ctx.defaultSize} isFavorite loggedIn />
      ))}
    </div>
  );
}

async function Addresses({ userId }: { userId: string }) {
  const [addresses, zones] = await Promise.all([
    db.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: { district: "asc" } }),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ul className="space-y-3">
        {addresses.length === 0 && <li className="text-muted-foreground">Nenhum endereço salvo.</li>}
        {addresses.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border border-cream-300 bg-white p-4">
            <div className="text-sm">
              <p className="font-semibold text-forest">
                {a.label} {a.isDefault && <span className="ml-1 rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf">Padrão</span>}
              </p>
              <p className="text-muted-foreground">{a.street}, {a.number}{a.complement ? ` - ${a.complement}` : ""}</p>
              <p className="text-muted-foreground">{a.district} · {a.city}/{a.state} · CEP {a.zip}</p>
            </div>
            <AddressActions id={a.id} isDefault={a.isDefault} />
          </li>
        ))}
      </ul>
      <AddressForm districts={zones.map((z) => z.district)} />
    </div>
  );
}

async function Loyalty({ points, userId }: { points: number; userId: string }) {
  const [settings, pending] = await Promise.all([
    getSettings(),
    db.order.aggregate({ where: { userId, status: { notIn: ["DELIVERED", "CANCELED"] } }, _sum: { pointsEarned: true } }),
  ]);
  const progress = Math.min(100, ((points % settings.pointsPerRedemption) / settings.pointsPerRedemption) * 100);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl bg-forest p-8 text-cream shadow-lift">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Programa de fidelidade</p>
        <p className="mt-3 font-display text-6xl font-semibold">{points}</p>
        <p className="text-cream/70">pontos disponíveis</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-cream/15">
          <div className="h-full rounded-full bg-tangerine" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-cream/75">
          Faltam {settings.pointsPerRedemption - (points % settings.pointsPerRedemption)} pontos para mais {formatBRL(settings.redemptionValue)} de desconto.
        </p>
        {(pending._sum.pointsEarned ?? 0) > 0 && <p className="mt-2 text-sm text-cream/75">+{pending._sum.pointsEarned} pontos a caminho (pedidos em andamento).</p>}
      </div>
      <div className="rounded-3xl border border-cream-300 bg-white p-8 text-sm leading-relaxed text-forest">
        <h2 className="text-xl font-semibold">Como funciona</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Você ganha {settings.pointsPerReal} ponto por real gasto, creditado quando o pedido é entregue.</li>
          <li>Cada {settings.pointsPerRedemption} pontos valem {formatBRL(settings.redemptionValue)} de desconto no checkout.</li>
          <li>Pedidos cancelados devolvem os pontos usados.</li>
        </ul>
      </div>
    </div>
  );
}

async function Notifications({ userId }: { userId: string }) {
  const items = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="max-w-2xl">
      {items.some((n) => !n.read) && <div className="mb-4"><MarkReadButton /></div>}
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-muted-foreground">Sem notificações.</li>}
        {items.map((n) => (
          <li key={n.id} className={cn("rounded-2xl border bg-white p-4", n.read ? "border-cream-300" : "border-tangerine")}>
            <div className="flex justify-between gap-3">
              <p className="font-semibold text-forest">{n.title}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
            {n.href && <Link href={n.href} className="mt-2 inline-block text-sm font-semibold text-leaf underline">Ver</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
