"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Arquivos em /public/videos detectados no build (next.config.ts). Ver docs/higgsfield-prompts.md. */
const LOCAL_FILES = new Set((process.env.NEXT_PUBLIC_HERO_VIDEO_FILES ?? "").split(",").filter(Boolean));
const MOBILE_QUERY = "(max-width: 767px)";

type Sources = { webm?: string; mp4: string; mobileMp4?: string };

function localSources(): Sources | null {
  const has = (f: string) => LOCAL_FILES.has(f);
  const mp4 = has("hero.mp4") ? "/videos/hero.mp4" : has("hero-mobile.mp4") ? "/videos/hero-mobile.mp4" : null;
  if (!mp4) return null;
  return {
    mp4,
    webm: has("hero.webm") ? "/videos/hero.webm" : undefined,
    mobileMp4: has("hero-mobile.mp4") && mp4 !== "/videos/hero-mobile.mp4" ? "/videos/hero-mobile.mp4" : undefined,
  };
}

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
  videoUrl,
  alt,
  className,
}: {
  /** imagem estática (banner do painel) */
  poster: string | null;
  /** URL opcional cadastrada no painel; tem prioridade sobre os arquivos locais */
  videoUrl?: string | null;
  alt: string;
  className?: string;
}) {
  const [sources, setSources] = useState<Sources | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoAllowed()) return;
    const chosen = videoUrl ? { mp4: videoUrl } : localSources();
    if (!chosen) return;
    // espera a página terminar de carregar para não disputar banda com o LCP
    const start = () => setSources(chosen);
    if (document.readyState === "complete") {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, [videoUrl]);

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
    <div className={cn("absolute inset-0 overflow-hidden bg-forest", className)}>
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
