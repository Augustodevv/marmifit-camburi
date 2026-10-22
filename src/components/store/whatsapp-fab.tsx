"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const GAP = 16;

/**
 * Botão flutuante de WhatsApp em todas as páginas da loja.
 * - Fica acima de qualquer barra fixa marcada com data-mobile-bar (ex.: resumo do configurador).
 * - Some quando o rodapé (que já tem o link do WhatsApp) entra na tela.
 * - No celular, se esconde enquanto a pessoa rola para baixo e volta ao subir/parar,
 *   para não cobrir os botões dos cards.
 */
export function WhatsAppFab({ phone }: { phone: string }) {
  const [bottom, setBottom] = useState(GAP);
  const [footerVisible, setFooterVisible] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(false);

  // barras fixas no rodapé da tela (podem aparecer/sumir conforme a página e o tamanho da tela)
  useEffect(() => {
    const measure = () => {
      const bars = [...document.querySelectorAll<HTMLElement>("[data-mobile-bar]")];
      // getClientRects vazio = display:none (offsetParent não serve: é sempre null em position:fixed)
      const h = Math.max(0, ...bars.map((b) => (b.getClientRects().length ? b.getBoundingClientRect().height : 0)));
      setBottom(h + GAP);
    };
    measure();
    const ro = new ResizeObserver(measure);
    const watch = () => document.querySelectorAll("[data-mobile-bar]").forEach((b) => ro.observe(b));
    watch();
    const mo = new MutationObserver(() => {
      watch();
      measure();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let last = window.scrollY;
    let idle: number | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 6) setScrollingDown(y > last && y > 200);
      last = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setScrollingDown(false), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  const hidden = footerVisible;
  return (
    <a
      href={whatsappLink(phone, "Olá! Vim pelo site da Marmifit e quero fazer um pedido.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Marmifit no WhatsApp"
      tabIndex={hidden ? -1 : undefined}
      style={{ bottom }}
      className={cn(
        "group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#15803d] p-3.5 text-white shadow-[0_12px_30px_-6px_rgba(21,128,61,0.55)] transition-[transform,opacity,bottom] duration-300 hover:scale-105 hover:bg-[#166534] active:scale-95 sm:right-6 sm:p-4",
        hidden && "pointer-events-none translate-y-4 opacity-0",
        !hidden && scrollingDown && "max-sm:pointer-events-none max-sm:translate-y-24 max-sm:opacity-0",
      )}
    >
      <MessageCircle className="size-6" aria-hidden />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-40 sm:inline">
        Peça pelo WhatsApp
      </span>
    </a>
  );
}
