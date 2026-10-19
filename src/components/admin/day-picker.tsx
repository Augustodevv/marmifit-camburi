"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setProductDays } from "@/server/actions/admin";
import { WEEKDAYS } from "@/lib/hours";
import { cn } from "@/lib/utils";

export function DayPicker({ productId, initial }: { productId: string; initial: number[] }) {
  const [days, setDays] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1">
      {WEEKDAYS.map((d, i) => {
        const on = days.includes(i);
        return (
          <button
            key={d}
            type="button"
            disabled={pending}
            aria-pressed={on}
            onClick={() => {
              const next = on ? days.filter((x) => x !== i) : [...days, i].sort();
              setDays(next);
              start(async () => {
                await setProductDays(productId, next);
                toast.success("Dias atualizados");
              });
            }}
            className={cn("rounded-md px-2 py-1 text-xs font-semibold", on ? "bg-leaf text-white" : "bg-cream text-forest hover:bg-cream-200")}
          >
            {d.slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}
