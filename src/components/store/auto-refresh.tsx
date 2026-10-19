"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Atualiza os dados do servidor periodicamente enquanto a aba está visível. */
export function AutoRefresh({ seconds = 20, enabled = true }: { seconds?: number; enabled?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, enabled]);
  return null;
}
