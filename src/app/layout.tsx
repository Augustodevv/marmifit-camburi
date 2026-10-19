import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Marmifit Camburi — Marmitas saudáveis em Vitória",
    template: "%s · Marmifit Camburi",
  },
  description:
    "Peça marmitas tradicionais, fitness, low carb, vegetarianas e veganas em Jardim Camburi, Vitória - ES. Monte a sua, agende a entrega e acompanhe o pedido.",
  keywords: ["marmita", "marmita fitness", "Jardim Camburi", "Vitória", "delivery", "low carb", "marmita vegana"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Marmifit Camburi",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#163B2E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable} h-full`}>
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
