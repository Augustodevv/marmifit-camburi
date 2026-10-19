import type { Metadata } from "next";
import { PageHeader } from "@/components/store/section";

export const metadata: Metadata = { title: "Política de privacidade", alternates: { canonical: "/privacidade" } };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="LGPD" title="Política de privacidade" description="Como tratamos seus dados pessoais." />
      <article className="container-page max-w-3xl space-y-6 py-12 leading-relaxed text-ink/80 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-forest">
        <p>Esta política descreve como a Marmifit Camburi coleta e usa dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
        <h2>Quais dados coletamos</h2>
        <p>Nome, telefone, e-mail (opcional), endereço de entrega e histórico de pedidos. Senhas são armazenadas apenas como hash criptográfico. Não recebemos nem armazenamos dados de cartão: pagamentos online são processados pelo Mercado Pago.</p>
        <h2>Para que usamos</h2>
        <p>Para preparar e entregar pedidos, falar com você sobre o pedido, operar o programa de fidelidade e cumprir obrigações legais e fiscais. Não vendemos seus dados.</p>
        <h2>Compartilhamento</h2>
        <p>Compartilhamos apenas o necessário com o processador de pagamento (Mercado Pago) e, quando você usa o recurso de CEP, o número do CEP é consultado no serviço público ViaCEP.</p>
        <h2>Seus direitos</h2>
        <p>Você pode consultar e corrigir seus dados na área &quot;Minha conta&quot; e excluir a conta a qualquer momento. Pedidos antigos são mantidos de forma anonimizada pelo prazo exigido pela legislação fiscal.</p>
        <h2>Contato do encarregado</h2>
        <p>Use a página de contato para qualquer solicitação relacionada aos seus dados.</p>
      </article>
    </>
  );
}
