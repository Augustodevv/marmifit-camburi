"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/pricing";

interface Result {
  slug: string;
  name: string;
  category: string;
  price: number;
  fromPrice: boolean;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement))) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    abort.current?.abort();
    const term = value.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) setResults((await res.json()).results);
      } catch {
        /* requisição cancelada */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-cream-200"
        aria-label="Buscar no cardápio"
      >
        <Search className="size-5" />
      </DialogTrigger>
      <DialogContent className="top-[12%] translate-y-0 gap-0 overflow-hidden rounded-card bg-white p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">Buscar no cardápio</DialogTitle>
        <div className="flex items-center gap-3 border-b border-cream-300 px-4">
          <Search className="size-5 text-leaf-700" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Busque por frango, low carb, vegano, combo..."
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Termo de busca"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
          {q.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Digite pelo menos 2 letras.</p>
          ) : results.length === 0 && !loading ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nada encontrado.{" "}
              <Link href="/monte-sua-marmita" onClick={() => setOpen(false)} className="font-semibold text-leaf-700 underline">
                Que tal montar a sua?
              </Link>
            </div>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/cardapio/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-cream"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-forest">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-forest">
                      {r.fromPrice && <span className="mr-1 text-xs font-normal text-muted-foreground">a partir de</span>}
                      {formatBRL(r.price)}
                    </span>
                    <ArrowRight className="size-4 text-leaf-700 opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
