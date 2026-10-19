"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validators";
import { clientIp, rateLimit } from "@/lib/security";
import { safeRedirectPath } from "@/lib/format";

// hash válido de uma senha aleatória descartada, usado quando o e-mail não existe
const DUMMY_HASH = "$2b$12$b1KD78bQKS.BVG7G4pDf6OA7PCj2Utd3alO.xWUQSjRjpuosWwGcO";

export type AuthState = { message: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string> } | null;

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { email: String(formData.get("email") ?? "") };
  if (!rateLimit(`login:${await clientIp()}`, 10, 10 * 60_000)) {
    return { message: "Muitas tentativas. Aguarde alguns minutos.", values };
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors, values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // compara mesmo sem usuário para não revelar quais e-mails existem (tempo constante aproximado)
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { message: "E-mail ou senha incorretos.", values };

  await createSession({ sub: user.id, role: user.role, name: user.name });
  const fallback = user.role === "CUSTOMER" ? "/conta" : "/admin";
  redirect(safeRedirectPath(formData.get("next"), fallback));
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  if (!rateLimit(`register:${await clientIp()}`, 5, 30 * 60_000)) {
    return { message: "Muitas tentativas. Tente mais tarde.", values };
  }
  if (formData.get("consent") !== "on") {
    return { message: "É preciso aceitar a política de privacidade.", values };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Confira os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors, values };

  const exists = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return { message: "Já existe uma conta com este e-mail. Entre ou use outro e-mail.", values };

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await db.notification.create({
    data: { userId: user.id, title: "Bem-vindo(a) à Marmifit!", body: "Use o cupom BEMVINDO10 no primeiro pedido acima de R$ 30.", href: "/cardapio" },
  });
  await createSession({ sub: user.id, role: user.role, name: user.name });
  redirect(safeRedirectPath(formData.get("next"), "/conta"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
