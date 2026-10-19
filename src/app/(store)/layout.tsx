import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WhatsAppFab } from "@/components/store/whatsapp-fab";
import { getSettings } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-forest px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer whatsapp={settings.whatsappNumber} phone={settings.phone} pickupAddress={settings.pickupAddress} />
      {settings.whatsappNumber && <WhatsAppFab phone={settings.whatsappNumber} />}
    </>
  );
}
