"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Star } from "lucide-react";
import { addAddress, deleteAddress, setDefaultAddress, updateProfile, type FormState } from "@/server/actions/account";
import { markNotificationsRead } from "@/server/actions/store";
import { Button } from "@/components/ui/button";

function useToastState(state: FormState) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);
}

const inputCls = "mt-1 h-10 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20";

export function AddressForm({ districts }: { districts: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addAddress, null);
  const ref = useRef<HTMLFormElement>(null);
  useToastState(state);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];
  return (
    <form ref={ref} action={action} className="grid gap-3 rounded-2xl border border-cream-300 bg-white p-5 sm:grid-cols-6">
      <h3 className="font-sans text-sm font-bold text-forest sm:col-span-6">Novo endereço</h3>
      <L label="Apelido" className="sm:col-span-2"><input name="label" placeholder="Casa, Trabalho..." className={inputCls} /></L>
      <L label="CEP" className="sm:col-span-2" error={err("zip")}><input name="zip" inputMode="numeric" required className={inputCls} /></L>
      <L label="Bairro" className="sm:col-span-2" error={err("district")}>
        <select name="district" required className={inputCls} defaultValue="">
          <option value="" disabled>Selecione</option>
          {districts.map((d) => <option key={d}>{d}</option>)}
        </select>
      </L>
      <L label="Rua" className="sm:col-span-4" error={err("street")}><input name="street" required className={inputCls} /></L>
      <L label="Número" className="sm:col-span-2" error={err("number")}><input name="number" required className={inputCls} /></L>
      <L label="Complemento" className="sm:col-span-3"><input name="complement" className={inputCls} /></L>
      <L label="Referência" className="sm:col-span-3"><input name="reference" className={inputCls} /></L>
      <div className="sm:col-span-6">
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Salvando..." : "Salvar endereço"}</Button>
      </div>
    </form>
  );
}

export function AddressActions({ id, isDefault }: { id: string; isDefault: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      {!isDefault && (
        <button disabled={pending} onClick={() => start(() => setDefaultAddress(id))} className="rounded-full p-2 text-muted-foreground hover:bg-cream hover:text-forest" aria-label="Tornar padrão" title="Tornar padrão">
          <Star className="size-4" />
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => start(async () => { await deleteAddress(id); toast.success("Endereço removido"); })}
        className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remover endereço"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null);
  useToastState(state);
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-cream-300 bg-white p-5 sm:grid-cols-2">
      <L label="Nome" error={state?.fieldErrors?.name?.[0]}><input name="name" defaultValue={name} required className={inputCls} /></L>
      <L label="Telefone" error={state?.fieldErrors?.phone?.[0]}><input name="phone" defaultValue={phone} inputMode="tel" className={inputCls} /></L>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Salvando..." : "Salvar dados"}</Button>
      </div>
    </form>
  );
}

export function MarkReadButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => markNotificationsRead())}>
      Marcar todas como lidas
    </Button>
  );
}

function L({ label, children, className, error }: { label: string; children: React.ReactNode; className?: string; error?: string }) {
  return (
    <label className={`block text-xs font-semibold text-forest ${className ?? ""}`}>
      {label}
      {children}
      {error && <span className="mt-1 block font-medium text-destructive">{error}</span>}
    </label>
  );
}
