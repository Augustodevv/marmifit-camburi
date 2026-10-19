import Link from "next/link";
import { LogoMark } from "@/components/store/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <LogoMark className="mx-auto size-16" />
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-leaf">Erro 404</p>
        <h1 className="mt-2 text-5xl font-semibold text-forest">Esse prato saiu do cardápio</h1>
        <p className="mt-3 text-muted-foreground">A página que você procurou não existe ou mudou de endereço.</p>
        <Link href="/cardapio" className={`${buttonVariants({ size: "xl" })} mt-8`}>Ver cardápio</Link>
      </div>
    </main>
  );
}
