import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-forest px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Header user={session ? { name: session.name, role: session.role } : null} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer hours={settings.hours} whatsapp={settings.whatsappNumber} pickupAddress={settings.pickupAddress} />
    </>
  );
}
