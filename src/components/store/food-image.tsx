"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETTES = [
  ["#F3E9D2", "#7A4B2A", "#5E9E5A", "#E8893A"],
  ["#F6EEDC", "#3B2A20", "#43865B", "#D9A441"],
  ["#EFE6CF", "#8C5A2B", "#7DB36B", "#C9672C"],
  ["#F4ECD8", "#4A3426", "#2F7A4D", "#F59E42"],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Foto do prato quando cadastrada (ou presente por convenção em public/); caso
 * contrário — ou se o arquivo falhar — uma ilustração vetorial de marmita, nunca
 * uma foto falsa. Use sempre com proporção fixa (ex.: aspect-[4/3]) para não
 * haver layout shift.
 */
export function FoodImage({
  src,
  alt,
  seed,
  blurDataURL,
  className,
  imgClassName,
  sizes = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  preload,
  eager,
}: {
  src?: string | null;
  alt: string;
  seed: string;
  /** blur do manifesto de mídia (src/lib/media.ts); sem ele, carrega sem placeholder */
  blurDataURL?: string | null;
  className?: string;
  /** classes da <img> (ex.: zoom no hover) */
  imgClassName?: string;
  sizes?: string;
  /** só para a imagem principal da página (LCP) */
  preload?: boolean;
  /** carrega sem lazy (primeiros cards visíveis), sem o preload no <head> */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // blur: a miniatura de 12 px ampliada pelo CSS (o navegador suaviza). O placeholder="blur"
      // do next/image usa um filtro SVG por imagem, caro de pintar quando há muitas na página.
      <div
        className={cn("relative overflow-hidden bg-cream-200 bg-cover bg-center", className)}
        style={blurDataURL ? { backgroundImage: `url("${blurDataURL}")` } : undefined}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          loading={eager && !preload ? "eager" : undefined}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
        />
      </div>
    );
  }
  const h = hash(seed);
  const [rice, beans, greens, protein] = PALETTES[h % PALETTES.length];
  const rot = (h % 4) * 90;
  return (
    <div className={cn("relative overflow-hidden bg-forest grain", className)} role="img" aria-label={`Ilustração: ${alt}`}>
      <svg viewBox="0 0 200 200" className={cn("absolute inset-0 m-auto h-[82%] w-[82%] drop-shadow-xl", imgClassName)} aria-hidden>
        <g transform={`rotate(${rot} 100 100)`}>
          <rect x="18" y="30" width="164" height="140" rx="26" fill="#0f2a20" opacity="0.35" transform="translate(4 6)" />
          <rect x="18" y="30" width="164" height="140" rx="26" fill="#FFFDF7" />
          <rect x="28" y="40" width="88" height="120" rx="18" fill={rice} />
          <g fill="#fff" opacity="0.7">
            {Array.from({ length: 18 }).map((_, i) => (
              <ellipse key={i} cx={38 + ((i * 23) % 70)} cy={52 + ((i * 37) % 100)} rx="3.2" ry="1.4" transform={`rotate(${(i * 40) % 180} ${38 + ((i * 23) % 70)} ${52 + ((i * 37) % 100)})`} />
            ))}
          </g>
          <rect x="124" y="40" width="48" height="56" rx="14" fill={beans} />
          <g fill="#000" opacity="0.18">
            <circle cx="138" cy="56" r="4" />
            <circle cx="154" cy="62" r="4" />
            <circle cx="144" cy="76" r="4" />
            <circle cx="160" cy="82" r="3.5" />
          </g>
          <rect x="124" y="104" width="48" height="56" rx="14" fill={greens} />
          <g fill="#fff" opacity="0.25">
            <path d="M134 118c8-6 18-4 22 4-8 2-16 2-22-4z" />
            <path d="M138 140c8-6 18-4 22 4-8 2-16 2-22-4z" />
          </g>
          <ellipse cx="72" cy="100" rx="30" ry="22" fill={protein} />
          <g stroke="#7a3a12" strokeWidth="3" opacity="0.35" strokeLinecap="round">
            <path d="M54 92l36 0" />
            <path d="M52 102l40 0" />
            <path d="M56 112l32 0" />
          </g>
        </g>
      </svg>
    </div>
  );
}
