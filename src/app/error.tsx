"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <h1 className="text-4xl font-semibold text-forest">Algo deu errado por aqui</h1>
        <p className="mt-3 text-muted-foreground">Tivemos um problema ao carregar esta página. Tente novamente em instantes.</p>
        {error.digest && <p className="mt-1 text-xs text-muted-foreground">Código: {error.digest}</p>}
        <Button size="xl" className="mt-8" onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
