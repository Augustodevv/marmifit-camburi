import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getSession } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/format";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeRedirectPath(sp.next, "/conta") : undefined;
  if (await getSession()) redirect(next ?? "/conta");
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-cream-300 bg-white p-8 shadow-lift">
        <h1 className="text-3xl font-semibold text-forest">Bom te ver de novo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre para pedir novamente, ver favoritos e juntar pontos.</p>
        <div className="mt-6">
          <AuthForm mode="login" next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href={`/cadastro${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-leaf underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
