import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getSession } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/format";

export const metadata: Metadata = { title: "Acesso da equipe", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/entrar">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeRedirectPath(sp.next, "/admin") : undefined;
  const session = await getSession();
  if (session && session.role !== "CUSTOMER") redirect(next ?? "/admin");
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-panel border border-cream-300 bg-white p-8 shadow-lift">
        <h1 className="text-3xl font-semibold text-forest">Acesso da equipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">Área restrita ao painel administrativo. Para pedir, não é preciso conta.</p>
        <div className="mt-6">
          <AuthForm next={next} />
        </div>
      </div>
    </div>
  );
}
