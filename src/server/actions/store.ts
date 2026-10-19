"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { contactSchema, reviewSchema } from "@/lib/validators";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[] | undefined> } | null;

export async function toggleFavorite(productId: string): Promise<{ ok: boolean; favorite?: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Entre na sua conta para salvar favoritos." };
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false, message: "Produto não encontrado." };
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: user.id, productId } });
  revalidatePath("/conta");
  return { ok: true, favorite: !existing };
}

export async function sendContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Confira os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (formData.get("website")) return { ok: true, message: "Mensagem enviada!" }; // honeypot anti-spam
  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Mensagem enviada! Respondemos em até 1 dia útil." };
}

/** Avaliação verificada: exige pedido entregue do usuário contendo o produto. */
export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Entre na sua conta para avaliar." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Escolha de 1 a 5 estrelas." };
  const { productId, orderId, rating, comment } = parsed.data;
  const order = await db.order.findFirst({
    where: { id: orderId, userId: user.id, status: "DELIVERED", items: { some: { productId } } },
    select: { id: true },
  });
  if (!order) return { ok: false, message: "Só é possível avaliar produtos de pedidos entregues." };
  await db.review.upsert({
    where: { userId_productId_orderId: { userId: user.id, productId, orderId } },
    update: { rating, comment: comment || null },
    create: { userId: user.id, productId, orderId, rating, comment: comment || null },
  });
  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (product) revalidatePath(`/cardapio/${product.slug}`);
  revalidatePath("/conta");
  return { ok: true, message: "Obrigado pela avaliação!" };
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/conta");
}
