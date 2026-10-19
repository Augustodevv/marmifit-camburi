"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login, type AuthState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export function AuthForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Input label="E-mail" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} error={err("email")} required />
      <Input
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        error={err("password")}
        required
      />
      {state?.message && (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" size="xl" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Entrar
      </Button>
    </form>
  );
}

function Input({
  label,
  name,
  error,
  hint,
  ...rest
}: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-forest">{label}</label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="mt-1.5 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus:border-leaf focus:ring-3 focus:ring-leaf/20 aria-invalid:border-destructive"
        {...rest}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
