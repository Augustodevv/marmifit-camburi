"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BellRing } from "lucide-react";
import { toast } from "sonner";
import { markPaidOnDelivery, updateOrderStatus } from "@/server/actions/admin";
import { ORDER_STATUS_LABEL, type OrderStatusKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderActions({
  orderId,
  next,
  canMarkPaid,
}: {
  orderId: string;
  next: OrderStatusKey[];
  canMarkPaid: boolean;
}) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  function run(status: OrderStatusKey) {
    if (status === "CANCELED" && !window.confirm("Cancelar este pedido? O cliente será notificado.")) return;
    const fd = new FormData();
    fd.set("orderId", orderId);
    fd.set("status", status);
    if (status === "CANCELED") {
      const reason = window.prompt("Motivo do cancelamento (opcional):") ?? "";
      fd.set("note", reason);
    }
    setBusy(status);
    start(async () => {
      const r = await updateOrderStatus(null, fd);
      setBusy(null);
      if (r?.ok) toast.success(r.message);
      else toast.error(r?.message ?? "Erro");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <button
          key={s}
          disabled={pending}
          onClick={() => run(s)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50",
            s === "CANCELED" ? "border border-destructive/40 text-destructive hover:bg-destructive/10" : "bg-forest text-cream hover:bg-forest-800",
          )}
        >
          {busy === s && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {s === "CANCELED" ? "Cancelar" : `→ ${ORDER_STATUS_LABEL[s]}`}
        </button>
      ))}
      {canMarkPaid && (
        <button
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("orderId", orderId);
            start(async () => {
              const r = await markPaidOnDelivery(null, fd);
              if (r?.ok) toast.success(r.message);
              else toast.error(r?.message ?? "Erro");
              router.refresh();
            });
          }}
          className="rounded-lg border border-leaf px-3 py-2 text-xs font-bold text-leaf hover:bg-leaf-100"
        >
          Marcar como pago
        </button>
      )}
    </div>
  );
}

/** Avisa (toast + som) quando chega um pedido novo enquanto o painel está aberto. */
export function NewOrderAlert({ latestId, latestNumber }: { latestId: string | null; latestNumber: string | null }) {
  const prev = useRef(latestId);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    if (latestId && prev.current && latestId !== prev.current) {
      toast.success(`Novo pedido ${latestNumber}!`, { duration: 10000 });
      if (sound) beep();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Novo pedido na Marmifit", { body: latestNumber ?? "" });
      }
    }
    prev.current = latestId;
  }, [latestId, latestNumber, sound]);

  return (
    <button
      type="button"
      onClick={() => {
        setSound((s) => !s);
        if (!sound) {
          beep();
          if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
        }
      }}
      aria-pressed={sound}
      className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold", sound ? "border-leaf bg-leaf-100 text-leaf" : "border-cream-300 bg-white text-forest")}
    >
      <BellRing className="size-4" aria-hidden /> {sound ? "Alerta sonoro ligado" : "Ativar alerta sonoro"}
    </button>
  );
}

function beep() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch {
    /* navegador sem suporte a áudio */
  }
}
