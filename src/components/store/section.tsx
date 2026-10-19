import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "Ver todos",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">{eyebrow}</p>}
        <h2 className="mt-2 text-3xl font-semibold text-forest sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-leaf">
          {hrefLabel}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-cream">
      <div aria-hidden className="absolute -left-24 -top-24 -z-10 size-96 animate-[blob_14s_ease-in-out_infinite] rounded-full bg-leaf/50 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 right-0 -z-10 size-96 animate-[blob_18s_ease-in-out_infinite_reverse] rounded-full bg-tangerine/35 blur-3xl" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#F8F5ED_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container-page animate-[rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both] py-14 sm:py-20">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-semibold sm:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg text-cream/75">{description}</p>}
        {children}
      </div>
    </section>
  );
}
