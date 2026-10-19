"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PayButton({ number, token }: { number: string; token?: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      size="xl"
      variant="accent"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/orders/${number}/pay`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          window.location.href = data.paymentUrl;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erro ao abrir pagamento.");
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-5" aria-hidden />}
      Pagar agora
    </Button>
  );
}
