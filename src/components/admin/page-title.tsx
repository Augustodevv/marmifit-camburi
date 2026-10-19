export function AdminTitle({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-forest">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-cream-300 bg-white p-5 shadow-soft ${className ?? ""}`}>
      {title && <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-forest">{title}</h2>}
      {children}
    </section>
  );
}
