import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getSession } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/format";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/cadastro">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeRedirectPath(sp.next, "/conta") : undefined;
  if (await getSession()) redirect(next ?? "/conta");
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-3xl border border-cream-300 bg-white p-8 shadow-lift">
        <h1 className="text-3xl font-semibold text-forest">Crie sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ganhe pontos a cada pedido e troque por desconto.</p>
        <div className="mt-6">
          <AuthForm mode="register" next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-leaf underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
