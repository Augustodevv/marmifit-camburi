"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminState } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  className,
  resetOnSuccess,
  submitVariant = "default",
  inlineSubmit,
}: {
  action: (prev: AdminState, fd: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  submitVariant?: "default" | "accent" | "outline";
  inlineSubmit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
    } else toast.error(state.message);
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <div className={cn(inlineSubmit ? "contents" : "mt-4 flex items-center gap-3")}>
        <Button type="submit" size="lg" variant={submitVariant} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {submitLabel}
        </Button>
        {!inlineSubmit && state && !state.ok && <p className="text-sm text-destructive" role="alert">{state.message}</p>}
      </div>
    </form>
  );
}

/** Botão que chama uma server action simples (toggle/excluir) com feedback. */
export function ActionButton({
  run,
  children,
  className,
  confirm,
  success,
  label,
}: {
  run: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  success?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          try {
            await run();
            if (success) toast.success(success);
            router.refresh();
          } catch {
            toast.error("Não foi possível concluir a ação.");
          }
        });
      }}
      className={cn("disabled:opacity-50", className)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : children}
    </button>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  className,
  hint,
  required,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  className?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className={cn("block text-xs font-semibold text-forest", className)}>
      {label}
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-normal outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20"
      />
      {hint && <span className="mt-1 block font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-forest">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[#43865B]" />
      {label}
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 3, className }: { label: string; name: string; defaultValue?: string | null; rows?: number; className?: string }) {
  return (
    <label className={cn("block text-xs font-semibold text-forest", className)}>
      {label}
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? ""} className="mt-1 w-full rounded-lg border border-input bg-white p-3 text-sm font-normal outline-none focus:border-leaf" />
    </label>
  );
}
