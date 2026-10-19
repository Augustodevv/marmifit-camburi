import Link from "next/link";
import { MapPin, MessageCircle, Clock } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { WEEKDAYS, type DayHours } from "@/lib/hours";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer({
  hours,
  whatsapp,
  pickupAddress,
}: {
  hours: DayHours[];
  whatsapp: string | null;
  pickupAddress: string;
}) {
  return (
    <footer className="mt-24 bg-forest text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
            Comida de verdade, feita todo dia em Camburi. Marmitas tradicionais, fitness, low carb e veganas, entregues no
            seu horário.
          </p>
          <div className="mt-5 flex gap-2">
            {whatsapp && (
              <a
                href={whatsappLink(whatsapp, "Olá! Vim pelo site da Marmifit.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full bg-cream/10 hover:bg-cream/20"
                aria-label="Falar no WhatsApp"
              >
                <MessageCircle className="size-5" />
              </a>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Cardápio</h2>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li><Link className="hover:text-white" href="/cardapio">Todas as marmitas</Link></li>
            <li><Link className="hover:text-white" href="/monte-sua-marmita">Monte a sua</Link></li>
            <li><Link className="hover:text-white" href="/marmitas-do-dia">Marmitas do dia</Link></li>
            <li><Link className="hover:text-white" href="/combos-e-promocoes">Combos e promoções</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Ajuda</h2>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li><Link className="hover:text-white" href="/acompanhar">Acompanhar pedido</Link></li>
            <li><Link className="hover:text-white" href="/sobre">Sobre nós</Link></li>
            <li><Link className="hover:text-white" href="/contato">Contato</Link></li>
            <li><Link className="hover:text-white" href="/privacidade">Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-tangerine">Horários</h2>
          <ul className="mt-4 space-y-1 text-sm text-cream/80">
            {hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{WEEKDAYS[h.day]}</span>
                <span className="tabular-nums">{h.enabled ? `${h.open} – ${h.close}` : "Fechado"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex gap-2 text-sm text-cream/80">
            <MapPin className="mt-0.5 size-4 shrink-0 text-tangerine" aria-hidden /> {pickupAddress}
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Marmifit Camburi. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden /> Pedidos agendados com até 7 dias de antecedência
          </p>
        </div>
      </div>
    </footer>
  );
}

