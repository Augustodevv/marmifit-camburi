import type { Metadata } from "next";

export const SITE_NAME = "Marmifit Camburi";

const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Marmifit Camburi — marmitas caseiras em Camburi, São Sebastião (SP)" };

/**
 * Metadados de uma página da loja. O openGraph do filho substitui o do layout
 * por inteiro, então repete aqui os campos base (tipo, idioma, nome do site).
 * Por isso também aponta a imagem padrão (src/app/opengraph-image.tsx); a página
 * do prato troca pela foto dele.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME, title: `${title} · ${SITE_NAME}`, description, url: path, images: [DEFAULT_IMAGE] },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [DEFAULT_IMAGE.url] },
  };
}
