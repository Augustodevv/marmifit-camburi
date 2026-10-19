"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bike, CreditCard, Gift, Loader2, Lock, QrCode, Store, Ticket, Wallet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCart, toApiItems } from "@/components/store/cart-store";
import { useCartValidation } from "@/components/store/cart-view";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";

interface Addr {
  id?: string;
  label: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zip: string;
  reference: string;
}

interface Quote {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
  pointsUsed: number;
  pointsDiscount: number;
  total: number;
  problems: string[];
  etaMinutes: number | null;
}

const EMPTY_ADDR: Addr = { label: "Casa", street: "", number: "", complement: "", district: "", city: "São Sebastião", state: "SP", zip: "", reference: "" };

export function CheckoutForm(props: {
  zones: { district: string; fee: number; eta: number }[];
  slots: { value: string; label: string; dayLabel: string }[];
  openNow: boolean;
  acceptingOrders: boolean;
  onlinePayment: boolean;
  pickupAddress: string;
  freeDeliveryMin: number | null;
}) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const { errors: lineErrors } = useCartValidation();
  const mounted = useHydrated();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [addr, setAddr] = useState<Addr>(EMPTY_ADDR);
  const [when, setWhen] = useState<"now" | "schedule">(props.openNow ? "now" : "schedule");
  const [slot, setSlot] = useState(props.slots[0]?.value ?? "");
  const [payment, setPayment] = useState<"PIX" | "CARD" | "ON_DELIVERY">(props.onlinePayment ? "PIX" : "ON_DELIVERY");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteState, setQuoteState] = useState<{ key: string; quote: Quote | null }>({ key: "", quote: null });
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [cepLoading, setCepLoading] = useState(false);

  const scheduledFor = when === "schedule" ? slot || null : null;
  const items = useMemo(() => toApiItems(lines), [lines]);

  const quotePayload = JSON.stringify({
    items,
    fulfillment,
    address: fulfillment === "DELIVERY" ? { district: addr.district } : undefined,
    scheduledFor,
    paymentMethod: payment,
    couponCode: coupon,
    usePoints: false,
  });
  const quote = quoteState.quote;
  const quoting = quoteState.key !== quotePayload;

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/checkout/quote", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal, body: quotePayload })
        .then((r) => r.json())
        .then((q: Quote) => setQuoteState({ key: quotePayload, quote: q }))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [mounted, items.length, quotePayload]);

  useEffect(() => {
    if (quote?.couponError && coupon) toast.error(quote.couponError);
    else if (quote?.couponCode && coupon) toast.success(`Cupom ${quote.couponCode} aplicado`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.couponCode, quote?.couponError]);

  async function lookupCep(value: string) {
    const cep = value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      const zone = props.zones.find((z) => norm(z.district) === norm(d.bairro ?? ""));
      setAddr((a) => ({ ...a, street: d.logradouro || a.street, city: d.localidade || a.city, state: d.uf || a.state, district: zone?.district ?? a.district }));
      if (d.bairro && !zone) toast("Bairro fora da nossa área de entrega", { description: `${d.bairro}: escolha retirada ou outro endereço.` });
    } catch {
      /* sem conexão com o ViaCEP: o cliente preenche à mão */
    } finally {
      setCepLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErrors([]);
    const errs: string[] = [];
    if (name.trim().length < 2) errs.push("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) errs.push("Informe um telefone com DDD.");
    if (fulfillment === "DELIVERY" && (!addr.street || !addr.number || !addr.district || addr.zip.replace(/\D/g, "").length !== 8)) {
      errs.push("Complete o endereço de entrega (CEP, rua, número e bairro).");
    }
    if (when === "schedule" && !slot) errs.push("Escolha um horário para o agendamento.");
    if (errs.length) {
      setSubmitErrors(errs);
      toast.error(errs[0]);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          fulfillment,
          address: fulfillment === "DELIVERY" ? { ...addr, id: undefined } : undefined,
          scheduledFor,
          paymentMethod: payment,
          couponCode: coupon,
          usePoints: false,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitErrors(data.details?.length ? data.details : [data.error]);
        toast.error(data.error ?? "Não foi possível finalizar.");
        return;
      }
      setPlaced(true);
      clear();
      if (data.paymentUrl) {
        toast.success(`Pedido ${data.number} criado! Abrindo o pagamento...`);
        window.location.href = data.paymentUrl;
      } else {
        toast.success(`Pedido ${data.number} recebido!`);
        router.push(`/pedido/${data.number}?t=${data.token}&novo=1`);
      }
    } catch {
      toast.error("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="container-page grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[600px] rounded-3xl bg-cream-200" />
        <Skeleton className="h-80 rounded-3xl bg-cream-200" />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center" role="status">
        <Loader2 className="size-10 animate-spin text-leaf" aria-hidden />
        <p className="mt-4 font-display text-2xl text-forest">Pedido enviado! Abrindo os detalhes...</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-4xl font-semibold text-forest">Nada para finalizar</h1>
        <p className="mt-2 text-muted-foreground">Seu carrinho está vazio.</p>
        <Link href="/cardapio" className={cn(buttonVariants({ size: "xl" }), "mt-8")}>Ver cardápio</Link>
      </div>
    );
  }

  const zone = props.zones.find((z) => z.district === addr.district);
  const blocking = [...(quote?.problems ?? []), ...(coupon && quote?.couponError ? [quote.couponError] : [])];
  const canSubmit = !submitting && !quoting && quote !== null && blocking.length === 0 && Object.keys(lineErrors).length === 0;

  return (
    <form onSubmit={submit} className="container-page grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_400px]" noValidate>
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold text-forest">Finalizar pedido</h1>

        <Fieldset step={1} title="Seus dados">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" id="name" value={name} onChange={setName} autoComplete="name" required />
            <Field label="WhatsApp / telefone" id="phone" value={phone} onChange={setPhone} autoComplete="tel" inputMode="tel" placeholder="(12) 99999-9999" required />
            <Field label="E-mail (opcional)" id="email" value={email} onChange={setEmail} autoComplete="email" type="email" className="sm:col-span-2" />
          </div>
        </Fieldset>

        <Fieldset step={2} title="Entrega ou retirada">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice selected={fulfillment === "DELIVERY"} onClick={() => setFulfillment("DELIVERY")} icon={Bike} title="Entrega" subtitle={zone ? `${formatBRL(zone.fee)} · ~${zone.eta} min` : "Taxa conforme o bairro"} />
            <Choice selected={fulfillment === "PICKUP"} onClick={() => setFulfillment("PICKUP")} icon={Store} title="Retirada" subtitle="Grátis · na nossa cozinha" />
          </div>
          {fulfillment === "PICKUP" ? (
            <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-forest">Retire em: <strong>{props.pickupAddress}</strong></p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-6">
                <div className="relative sm:col-span-2">
                  <Field label="CEP" id="zip" value={addr.zip} onChange={(v) => setAddr({ ...addr, zip: v })} onBlur={lookupCep} inputMode="numeric" autoComplete="postal-code" placeholder="11600-000" required />
                  {cepLoading && <Loader2 className="absolute right-3 top-9 size-4 animate-spin text-muted-foreground" aria-label="Buscando CEP" />}
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="district" className="text-sm font-semibold text-forest">Bairro</label>
                  <select
                    id="district"
                    value={addr.district}
                    onChange={(e) => setAddr({ ...addr, district: e.target.value })}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20"
                  >
                    <option value="">Selecione o bairro</option>
                    {props.zones.map((z) => (
                      <option key={z.district} value={z.district}>
                        {z.district} — {formatBRL(z.fee)}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Rua" id="street" value={addr.street} onChange={(v) => setAddr({ ...addr, street: v })} autoComplete="address-line1" className="sm:col-span-4" required />
                <Field label="Número" id="number" value={addr.number} onChange={(v) => setAddr({ ...addr, number: v })} className="sm:col-span-2" required />
                <Field label="Complemento" id="complement" value={addr.complement} onChange={(v) => setAddr({ ...addr, complement: v })} autoComplete="address-line2" className="sm:col-span-3" />
                <Field label="Ponto de referência" id="reference" value={addr.reference} onChange={(v) => setAddr({ ...addr, reference: v })} className="sm:col-span-3" />
              </div>
              {props.freeDeliveryMin && <p className="text-xs text-muted-foreground">Entrega grátis em pedidos acima de {formatBRL(props.freeDeliveryMin)}.</p>}
            </div>
          )}
        </Fieldset>

        <Fieldset step={3} title="Quando">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              selected={when === "now"}
              onClick={() => props.openNow && setWhen("now")}
              disabled={!props.openNow}
              icon={Bike}
              title="O quanto antes"
              subtitle={props.openNow ? "Começamos a preparar agora" : "Cozinha fechada agora"}
            />
            <Choice selected={when === "schedule"} onClick={() => setWhen("schedule")} icon={Gift} title="Agendar" subtitle="Escolha dia e horário" />
          </div>
          {when === "schedule" && (
            <div className="mt-4">
              {props.slots.length === 0 ? (
                <p className="text-sm text-destructive">Não há horários disponíveis nos próximos dias.</p>
              ) : (
                <>
                  <label htmlFor="slot" className="text-sm font-semibold text-forest">Dia e horário</label>
                  <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm">
                    {props.slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.dayLabel} às {s.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </Fieldset>

        <Fieldset step={4} title="Pagamento">
          <div className="grid gap-3 sm:grid-cols-3">
            <Choice selected={payment === "PIX"} onClick={() => setPayment("PIX")} disabled={!props.onlinePayment} icon={QrCode} title="Pix" subtitle="Aprovação na hora" />
            <Choice selected={payment === "CARD"} onClick={() => setPayment("CARD")} disabled={!props.onlinePayment} icon={CreditCard} title="Cartão" subtitle="Crédito ou débito" />
            <Choice selected={payment === "ON_DELIVERY"} onClick={() => setPayment("ON_DELIVERY")} icon={Wallet} title="Na entrega" subtitle="Dinheiro, Pix ou maquininha" />
          </div>
          {props.onlinePayment ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden /> Pix e cartão são processados no ambiente seguro do Mercado Pago. Não recebemos os dados do seu cartão.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Pagamento online ainda não habilitado pela loja. Pague na entrega ou na retirada.</p>
          )}
        </Fieldset>

        <Fieldset step={5} title="Observações do pedido">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Ex.: interfone quebrado, troco para R$ 100, entregar na portaria..."
            className="w-full rounded-xl border border-input bg-white p-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20"
            aria-label="Observações do pedido"
          />
        </Fieldset>
      </div>

      <aside>
        <div className="sticky top-24 space-y-4 rounded-3xl border border-cream-300 bg-white p-6 shadow-lift">
          <h2 className="text-2xl font-semibold text-forest">Seu pedido</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold">{l.quantity}x</span> {l.name}
                  {l.sizeLabel && <span className="block text-xs text-muted-foreground">{l.sizeLabel}</span>}
                  {lineErrors[l.key] && <span className="block text-xs text-destructive">{lineErrors[l.key]}</span>}
                </span>
                <span className="shrink-0 tabular-nums">{formatBRL(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Cupom de desconto</span>
              <Ticket className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Cupom"
                className="h-10 w-full rounded-xl border border-input pl-9 pr-3 text-sm uppercase outline-none focus:border-leaf"
              />
            </label>
            {coupon ? (
              <Button type="button" variant="outline" size="lg" onClick={() => { setCoupon(""); setCouponInput(""); }}>Remover</Button>
            ) : (
              <Button type="button" variant="secondary" size="lg" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim()}>Aplicar</Button>
            )}
          </div>

          <dl className="space-y-1.5 border-t border-dashed border-cream-300 pt-4 text-sm">
            <Row label="Subtotal" value={quote ? formatBRL(quote.subtotal) : null} />
            <Row label={fulfillment === "PICKUP" ? "Retirada" : "Entrega"} value={quote ? (quote.deliveryFee ? formatBRL(quote.deliveryFee) : "Grátis") : null} />
            {quote && quote.discount > 0 && <Row label={`Cupom ${quote.couponCode}`} value={`- ${formatBRL(quote.discount)}`} accent />}
            {quote && quote.pointsDiscount > 0 && <Row label={`Pontos (${quote.pointsUsed})`} value={`- ${formatBRL(quote.pointsDiscount)}`} accent />}
            <div className="flex items-baseline justify-between pt-2">
              <dt className="font-semibold text-forest">Total</dt>
              <dd>
                {quote ? (
                  <motion.span key={quote.total} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="inline-block font-display text-3xl font-semibold text-forest tabular-nums">
                    {formatBRL(quote.total)}
                  </motion.span>
                ) : (
                  <Skeleton className="h-8 w-28" />
                )}
              </dd>
            </div>
          </dl>

          {(blocking.length > 0 || submitErrors.length > 0) && (
            <ul className="space-y-1 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive" role="alert">
              {[...new Set([...submitErrors, ...blocking])].map((p) => (
                <li key={p} className="flex gap-1.5">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          )}

          <Button type="submit" size="xl" variant="accent" className="w-full" disabled={!canSubmit}>
            {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-5" aria-hidden />}
            {submitting ? "Enviando..." : payment === "ON_DELIVERY" ? "Confirmar pedido" : "Ir para o pagamento"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ao confirmar você concorda com nossa <Link href="/privacidade" className="underline">política de privacidade</Link>. Todos os valores são conferidos pelo servidor.
          </p>
        </div>
      </aside>
    </form>
  );
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

function Row({ label, value, accent }: { label: string; value: string | null; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", accent && "font-semibold text-leaf")}>{value ?? <Skeleton className="h-4 w-14" />}</dd>
    </div>
  );
}

function Fieldset({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-cream-300 bg-white p-5 shadow-soft sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-3" aria-hidden>
        <span className="flex size-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-cream">{step}</span>
        <h2 className="text-xl font-semibold text-forest">{title}</h2>
      </div>
      {children}
    </fieldset>
  );
}

function Choice({
  selected,
  onClick,
  icon: Icon,
  title,
  subtitle,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Bike;
  title: string;
  subtitle: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-leaf bg-leaf-100/60" : "border-cream-300 hover:border-leaf/50",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-leaf text-white" : "bg-cream text-forest")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-semibold text-forest">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  onBlur,
  className,
  ...rest
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur" | "value">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-forest">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-leaf focus:ring-3 focus:ring-leaf/20"
        {...rest}
      />
    </div>
  );
}
