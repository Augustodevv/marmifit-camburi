import { cn } from "@/lib/utils";

/*
 * Animações de entrada sem JavaScript de framework: o HTML chega visível e o
 * script do layout raiz (REVEAL_SCRIPT) só esconde/mostra quando o JS rodou.
 * Os estilos ficam em globals.css ([data-reveal] / [data-reveal-group]).
 */

/** Surge de baixo para cima quando entra na tela. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-reveal="" className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}

/** Grade cujos filhos aparecem em cascata. */
export function StaggerGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-reveal-group="" className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("h-full", className)}>{children}</div>;
}

/** Faixa de texto rolando sem parar (CSS puro; para com movimento reduzido). */
export function Marquee({ items, className, reverse }: { items: string[]; className?: string; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className={cn("relative flex overflow-hidden", className)} aria-hidden>
      <div
        className={cn(
          "flex shrink-0 items-center gap-10 pr-10 motion-reduce:animate-none",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
      >
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            {t}
            <span className="text-[0.6em]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Selo circular com texto girando. */
export function SpinningBadge({ text, className, children }: { text: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative grid size-28 place-items-center", className)} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow motion-reduce:animate-none">
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[10.5px] font-bold uppercase tracking-[0.28em]">
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      {children}
    </div>
  );
}

/**
 * Script inline (layout raiz): marca <html class="js"> e revela os blocos ao
 * entrarem na tela. Observa nós novos para funcionar nas navegações do cliente.
 * Sem IntersectionObserver, revela tudo de uma vez. Os blocos usam
 * suppressHydrationWarning porque o script acrescenta data-shown antes da hidratação.
 */
export const REVEAL_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");
var S="[data-reveal]:not([data-shown]),[data-reveal-group]:not([data-shown])";
function show(e){e.setAttribute("data-shown","")}
if(!("IntersectionObserver" in window)){d.classList.remove("js");return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:"0px 0px -60px 0px"});
function scan(){document.querySelectorAll(S).forEach(function(e){io.observe(e)})}
var q=0;function later(){if(!q){q=1;requestAnimationFrame(function(){q=0;scan()})}}
function start(){scan();new MutationObserver(later).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start()})();`;
