/** Assinatura e leitura do token de sessão (compatível com o proxy). */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

export interface SessionPayload {
  sub: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  name: string;
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET ausente ou curto (mínimo 32 caracteres).");
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role as SessionPayload["role"], name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
