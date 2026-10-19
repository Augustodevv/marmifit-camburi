"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { addressSchema, phoneSchema } from "@/lib/validators";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";

export type FormState = { ok: boolean; message: string; fieldErrors?: Record<string, string[] | undefined> } | null;

export async function addAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sessão expirada." };
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Confira o endereço.", fieldErrors: parsed.error.flatten().fieldErrors };
  const count = await db.address.count({ where: { userId: user.id } });
  if (count >= 10) return { ok: false, message: "Limite de 10 endereços." };
  await db.address.create({ data: { ...parsed.data, label: parsed.data.label || "Casa", userId: user.id, isDefault: count === 0 } });
  revalidatePath("/conta");
  return { ok: true, message: "Endereço salvo." };
}

export async function deleteAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/conta");
}

export async function setDefaultAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.updateMany({ where: { id, userId: user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/conta");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sessão expirada." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Confira os dados.", fieldErrors: parsed.error.flatten().fieldErrors };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/conta");
  return { ok: true, message: "Dados atualizados." };
}

/** LGPD: remove a conta e anonimiza os pedidos (mantidos para fins fiscais). */
export async function deleteAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (formData.get("confirm") !== "EXCLUIR") redirect("/conta?aba=dados&erro=confirmacao");
  if (user.role !== "CUSTOMER") redirect("/conta?aba=dados&erro=admin");
  await db.$transaction([
    db.order.updateMany({
      where: { userId: user.id },
      data: { customerName: "Cliente removido", customerPhone: "00000000000", customerEmail: null, address: Prisma.DbNull, userId: null },
    }),
    db.user.delete({ where: { id: user.id } }),
  ]);
  await destroySession();
  redirect("/?conta=removida");
}
