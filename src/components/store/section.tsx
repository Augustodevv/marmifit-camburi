import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "Ver todos",
  className,
}: {
  /** id do <h2> (para aria-labelledby da seção) */
  id?: string;
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
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf-700">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-3xl font-semibold text-balance text-forest sm:text-4xl lg:text-5xl">{title}</h2>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-leaf-700">
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
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_0%_0%,rgb(67_134_91/0.55),transparent),radial-gradient(50%_70%_at_100%_100%,rgb(245_158_66/0.28),transparent)]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#F8F5ED_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="container-page animate-rise py-14 sm:py-20">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-tangerine">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-semibold sm:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg text-cream/75">{description}</p>}
        {children}
      </div>
    </section>
  );
}
