"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
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
  if (user.role === "CUSTOMER") return { message: "Acesso restrito à equipe da loja.", values };

  await createSession({ sub: user.id, role: user.role, name: user.name });
  redirect(safeRedirectPath(formData.get("next"), "/admin"));
}


export async function logout() {
  await destroySession();
  redirect("/");
}
