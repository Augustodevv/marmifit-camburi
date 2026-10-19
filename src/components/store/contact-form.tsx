"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { sendContact, type ActionState } from "@/server/actions/store";
import { Button } from "@/components/ui/button";

const cls = "mt-1.5 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20";

export function ContactForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendContact, null);
  if (state?.ok) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-cream-300 bg-white p-10 text-center shadow-soft">
        <CheckCircle2 className="size-12 text-leaf" aria-hidden />
        <p className="mt-4 font-display text-2xl text-forest">{state.message}</p>
      </div>
    );
  }
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form action={action} className="space-y-4 rounded-3xl border border-cream-300 bg-white p-6 shadow-soft" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest">Nome<input name="name" required className={`${cls} h-11`} />{err("name") && <span className="text-xs text-destructive">{err("name")}</span>}</label>
        <label className="block text-sm font-semibold text-forest">E-mail<input name="email" type="email" required className={`${cls} h-11`} />{err("email") && <span className="text-xs text-destructive">{err("email")}</span>}</label>
      </div>
      <label className="block text-sm font-semibold text-forest">Telefone (opcional)<input name="phone" inputMode="tel" className={`${cls} h-11`} /></label>
      <label className="block text-sm font-semibold text-forest">
        Mensagem<textarea name="message" rows={5} required className={`${cls} py-3`} />
        {err("message") && <span className="text-xs text-destructive">{err("message")}</span>}
      </label>
      {state && !state.ok && <p className="text-sm text-destructive" role="alert">{state.message}</p>}
      <Button type="submit" size="xl" disabled={pending}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />} Enviar mensagem
      </Button>
    </form>
  );
}
