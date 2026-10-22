"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MOBILE_QUERY = "(max-width: 767px)";

export type HeroVideoSources = { webm?: string; mp4: string; mobileMp4?: string };

/** Vídeo só quando o visitante não pediu menos movimento nem economia de dados. */
function videoAllowed() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}

/**
 * Fundo do hero: a imagem (poster) é o LCP e aparece sempre; o vídeo em loop
 * entra por cima só depois do carregamento da página, quando começa a tocar.
 * Sem vídeo, com erro, movimento reduzido ou saveData: fica a imagem estática.
 */
export function HeroVideo({
  poster,
  posterBlur,
  video,
  alt,
  className,
}: {
  /** imagem estática (banner do painel) */
  poster: string | null;
  posterBlur?: string;
  /** vídeo do painel ou arquivos de public/videos; null = só a imagem */
  video: HeroVideoSources | null;
  alt: string;
  className?: string;
}) {
  const [sources, setSources] = useState<HeroVideoSources | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!video || !videoAllowed()) return;
    // espera a página terminar de carregar para não disputar banda com o LCP
    const start = () => setSources(video);
    if (document.readyState === "complete") {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, [video]);

  // pausa fora da tela para poupar bateria
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      // NotAllowedError = navegador bloqueou o autoplay (ex.: modo economia do iOS): fica a imagem
      if (e.isIntersecting) void v.play().catch((err: DOMException) => err.name === "NotAllowedError" && setSources(null));
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [sources]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden bg-forest bg-cover bg-center", className)}
      style={posterBlur ? { backgroundImage: `url("${posterBlur}")` } : undefined}
    >
      {poster && !posterFailed ? (
        <Image
          src={poster}
          alt={alt}
          fill
          preload
          fetchPriority="high"
          quality={75}
          sizes="100vw"
          onError={() => setPosterFailed(true)}
          className={cn("object-cover", !playing && "motion-safe:animate-ken-burns")}
        />
      ) : (
        <div role="img" aria-label={alt} className="size-full bg-[radial-gradient(70%_60%_at_70%_40%,#43865B,transparent),radial-gradient(60%_50%_at_20%_90%,rgb(245_158_66/0.45),transparent)]" />
      )}
      {sources && (
        <video
          ref={videoRef}
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-1000", playing ? "opacity-100" : "opacity-0")}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          onPlaying={() => setPlaying(true)}
        >
          {sources.mobileMp4 && <source src={sources.mobileMp4} type="video/mp4" media={MOBILE_QUERY} />}
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          {/* sem onError no <video>: um <source media> que não combina com a tela também dispara "error".
              A falha real é a da última fonte, quando nenhuma serviu. */}
          <source src={sources.mp4} type="video/mp4" onError={() => setSources(null)} />
        </video>
      )}
    </div>
  );
}
