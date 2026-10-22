import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { HeartHandshake, Leaf, Sprout, Timer } from "lucide-react";
import { PageHeader } from "@/components/store/section";
import { FoodImage } from "@/components/store/food-image";
import { buttonVariants } from "@/components/ui/button";
import { blurFor, conventionalImage } from "@/lib/media";
import { getSettings } from "@/server/catalog";

export const metadata: Metadata = pageMetadata({
  title: "Sobre nós",
  description: "A Marmifit Camburi prepara marmitas caseiras todos os dias em Camburi, São Sebastião, no Litoral Norte de SP.",
  path: "/sobre",
});

const VALUES = [
  { icon: Sprout, title: "Ingredientes frescos", text: "Compramos de fornecedores locais e cozinhamos no mesmo dia da entrega." },
  { icon: Leaf, title: "Equilíbrio sem neura", text: "Opções tradicionais, fitness, low carb e veganas. Você escolhe o que faz sentido para você." },
  { icon: Timer, title: "Pontualidade", text: "Agendamento por horário e acompanhamento do pedido em tempo real." },
  { icon: HeartHandshake, title: "Transparência", text: "Ingredientes e alergênicos sempre visíveis. Informação nutricional só com dados verificados." },
];

export default async function AboutPage() {
  const settings = await getSettings();
  // foto real da cozinha (public/images/cozinha/cozinha-1.webp); até lá, a foto do banner
  const kitchen = conventionalImage("cozinha", "cozinha-1");
  const photo = kitchen ?? settings.heroImage;
  return (
    <>
      <PageHeader eyebrow="Nossa história" title="Comida de casa, com cuidado de cozinha profissional" />
      <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-2">
        <FoodImage
          src={photo}
          blurDataURL={blurFor(photo)}
          alt={kitchen ? "Cozinha da Marmifit em Camburi" : "Marmitas preparadas pela Marmifit"}
          seed="sobre-cozinha"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-[4/3] rounded-panel shadow-lift"
        />
        <div className="space-y-4 text-lg leading-relaxed text-ink/80">
          <p>
            A Marmifit nasceu em Camburi com uma ideia simples: comer bem no dia a dia não deveria ser complicado. Por isso
            cozinhamos todos os dias, em pequenas quantidades, pratos que lembram comida de casa.
          </p>
          <p>
            Você pode escolher um prato pronto do cardápio ou montar a sua marmita do zero, do tamanho certo para a sua fome e
            com os ingredientes que combinam com o seu objetivo.
          </p>
          <Link href="/cardapio" className={buttonVariants({ size: "xl" })}>Conheça o cardápio</Link>
        </div>
      </div>
      <section className="container-page pb-6">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-card border border-cream-300 bg-white p-6 shadow-soft">
              <v.icon className="size-8 text-leaf-700" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-forest">{v.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
