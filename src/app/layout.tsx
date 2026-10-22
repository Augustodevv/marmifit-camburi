import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { REVEAL_SCRIPT } from "@/components/store/motion";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const description =
  "Marmitas caseiras, fitness, low carb e veganas feitas todo dia em Camburi, São Sebastião (SP). Monte a sua, agende a entrega e acompanhe o pedido.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marmifit Camburi — Marmitas caseiras e fit em Camburi, SP",
    template: "%s · Marmifit Camburi",
  },
  description,
  applicationName: "Marmifit Camburi",
  keywords: ["marmita", "Marmitas Camburi", "marmita fitness", "Camburi", "São Sebastião", "Litoral Norte", "delivery", "low carb", "marmita vegana", "moqueca caiçara"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Marmifit Camburi",
    title: "Marmifit Camburi — Marmitas caseiras e fit em Camburi, SP",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Marmifit Camburi — Marmitas caseiras e fit em Camburi, SP", description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#163B2E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o REVEAL_SCRIPT acrescenta a classe "js" antes da hidratação
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{ classNames: { toast: "!rounded-xl !border-cream-300 !font-sans", title: "!text-forest" } }}
        />
      </body>
    </html>
  );
}
