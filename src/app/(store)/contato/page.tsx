import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/store/section";
import { ContactForm } from "@/components/store/contact-form";
import { buttonVariants } from "@/components/ui/button";
import { formatPhone } from "@/lib/format";
import { whatsappLink } from "@/lib/whatsapp";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Contato",
  description: "Fale com a Marmifit Camburi pelo WhatsApp, telefone, e-mail ou formulário. Cozinha em Camburi, São Sebastião (SP).",
  path: "/contato",
});

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Contato" title="Fale com a gente" description="Dúvidas, encomendas para eventos ou sugestões de cardápio: respondemos rapidinho." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {s.whatsappNumber && (
            <a href={whatsappLink(s.whatsappNumber, "Olá! Vim pelo site da Marmifit.")} target="_blank" rel="noopener noreferrer" className={`${buttonVariants({ size: "xl" })} w-full bg-[#1f7a4d] hover:bg-[#1a6942]`}>
              <MessageCircle className="size-5" aria-hidden /> Chamar no WhatsApp
            </a>
          )}
          <ul className="space-y-3 rounded-panel border border-cream-300 bg-white p-6 text-sm text-forest shadow-soft">
            <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-leaf-700" aria-hidden /> {s.pickupAddress}</li>
            {(s.phone || s.whatsappNumber) && (
              <li className="flex gap-3">
                <Phone className="size-5 shrink-0 text-leaf-700" aria-hidden />
                <a href={`tel:+55${(s.phone || s.whatsappNumber)!.replace(/\D/g, "").replace(/^55/, "")}`} className="font-semibold hover:underline">
                  {formatPhone((s.phone || s.whatsappNumber)!)}
                </a>
              </li>
            )}
            {s.whatsappNumber && (
              <li className="flex gap-3">
                <MessageCircle className="size-5 shrink-0 text-leaf-700" aria-hidden />
                <a href={whatsappLink(s.whatsappNumber, "Olá! Vim pelo site da Marmifit.")} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                  WhatsApp {formatPhone(s.whatsappNumber)}
                </a>
              </li>
            )}
            {s.email && <li className="flex gap-3"><Mail className="size-5 shrink-0 text-leaf-700" aria-hidden /> <a href={`mailto:${s.email}`}>{s.email}</a></li>}
          </ul>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
