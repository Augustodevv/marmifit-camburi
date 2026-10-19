import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/store/section";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security";

export const metadata: Metadata = { title: "Acompanhar pedido" };

async function findOrder(formData: FormData) {
  "use server";
  const number = String(formData.get("number") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  if (!rateLimit(`track:${await clientIp()}`, 15, 10 * 60_000)) redirect("/acompanhar?erro=limite");
  if (!number || phone.length < 8) redirect("/acompanhar?erro=dados");
  const order = await db.order.findUnique({ where: { number }, select: { number: true, trackingToken: true, customerPhone: true } });
  // compara os últimos 8 dígitos para aceitar com ou sem DDD/55
  if (!order || order.customerPhone.slice(-8) !== phone.slice(-8)) redirect("/acompanhar?erro=nao-encontrado");
  redirect(`/pedido/${order.number}?t=${order.trackingToken}`);
}

const ERRORS: Record<string, string> = {
  dados: "Informe o número do pedido e o telefone usado na compra.",
  "nao-encontrado": "Não encontramos um pedido com esses dados.",
  limite: "Muitas tentativas. Aguarde alguns minutos.",
};

export default async function TrackPage({ searchParams }: PageProps<"/acompanhar">) {
  const sp = await searchParams;
  const error = typeof sp.erro === "string" ? ERRORS[sp.erro] : null;
  return (
    <>
      <PageHeader eyebrow="Acompanhar" title="Onde está meu pedido?" description="Digite o número do pedido (ex.: MF00012) e o telefone informado na compra." />
      <div className="container-page max-w-lg py-12">
        <form action={findOrder} className="space-y-4 rounded-3xl border border-cream-300 bg-white p-6 shadow-soft">
          <div>
            <label htmlFor="number" className="text-sm font-semibold text-forest">Número do pedido</label>
            <input id="number" name="number" required placeholder="MF00012" className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 uppercase outline-none focus:border-leaf" />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-semibold text-forest">Telefone</label>
            <input id="phone" name="phone" required inputMode="tel" placeholder="(27) 99999-9999" className="mt-1.5 h-11 w-full rounded-xl border border-input px-3 outline-none focus:border-leaf" />
          </div>
          {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
          <Button type="submit" size="xl" className="w-full">Acompanhar</Button>
        </form>
      </div>
    </>
  );
}
