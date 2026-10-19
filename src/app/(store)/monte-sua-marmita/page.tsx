import type { Metadata } from "next";
import { Configurator } from "@/components/store/configurator";
import { PageHeader } from "@/components/store/section";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Monte sua marmita",
  description: "Escolha estilo, tamanho, proteína, base, acompanhamentos e adicionais. O preço é calculado na hora.",
  alternates: { canonical: "/monte-sua-marmita" },
};

export default async function BuildPage() {
  const catalog = await getCatalog();
  if (!catalog.sizes.some((s) => s.active) || !catalog.styles.some((s) => s.active)) {
    return (
      <PageHeader title="Configurador em manutenção" description="Estamos atualizando o cardápio. Volte em instantes ou veja os pratos prontos." />
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Configurador"
        title="Monte sua marmita"
        description="Você escolhe cada detalhe. A gente calcula o preço na hora e prepara do jeitinho que você pediu."
      />
      <Configurator catalog={catalog} />
    </>
  );
}
