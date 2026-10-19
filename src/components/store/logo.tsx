import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="12" fill="#163B2E" />
      <path d="M8 21h24a12 12 0 0 1-24 0z" fill="#F8F5ED" />
      <path d="M20 19c0-6 4-10 10-10 0 6-4 10-10 10z" fill="#43865B" />
      <path d="M20 19c0-4-3-7-7-7 0 4 3 7 7 7z" fill="#F59E42" />
    </svg>
  );
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Marmifit Camburi — início">
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-semibold tracking-tight", light ? "text-cream" : "text-forest")}>
          Marmifit
        </span>
        <span className={cn("block text-[0.65rem] font-semibold uppercase tracking-[0.22em]", light ? "text-tangerine" : "text-leaf")}>
          Camburi
        </span>
      </span>
    </Link>
  );
}
