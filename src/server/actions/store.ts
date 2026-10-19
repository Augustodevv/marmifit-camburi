"use server";

import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validators";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[] | undefined> } | null;

export async function sendContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Confira os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (formData.get("website")) return { ok: true, message: "Mensagem enviada!" }; // honeypot anti-spam
  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Mensagem enviada! Respondemos em até 1 dia útil." };
}
