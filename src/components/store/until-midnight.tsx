"use client";

import { useSyncExternalStore } from "react";

/** Minutos até a meia-noite no horário de São Paulo (o "dia" do prato do dia). */
function minutesLeft() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return 24 * 60 - (get("hour") * 60 + get("minute"));
}

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

/** "Termina em 7h 32min" — só no navegador, para não divergir do HTML do servidor. */
export function UntilMidnight({ className }: { className?: string }) {
  const left = useSyncExternalStore(subscribe, minutesLeft, () => null);
  if (left == null) return null;
  const h = Math.floor(left / 60);
  const m = left % 60;
  return (
    <span className={className}>
      Termina em {h > 0 && `${h}h `}
      {m}min
    </span>
  );
}
