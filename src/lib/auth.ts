import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "@/lib/session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Usuário atual, conferido no banco (evita sessões de contas removidas). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, loyaltyPoints: true },
  });
}

/** Garante papel administrativo. Usado em toda página e ação do painel. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}

export async function requireOwner() {
  const user = await requireAdmin();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}
