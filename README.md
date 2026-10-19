# Marmifit Camburi

Plataforma de pedidos online de marmitas: cardápio, configurador de marmitas, carrinho, checkout com Mercado Pago, acompanhamento de pedidos e painel administrativo. O cliente pede sem criar conta; o login existe só para a equipe.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Framer Motion · Lucide · PostgreSQL · Prisma 7 · Zod 4 · Vitest · Vercel.

## Funcionalidades

**Loja**
- Home com hero animado, prato do dia, destaques, combos e avaliações verificadas
- Cardápio com 11 categorias, busca, filtros (sem glúten, sem leite, promoção, disponível hoje) e ordenação
- Página de cada prato: tamanhos, observações, ingredientes, alergênicos, nutrição (somente dados verificados) e recomendações
- **Configurador em 7 etapas** (estilo, tamanho, proteína + porção extra, base, acompanhamentos, adicionais, observações): preço instantâneo, limites por tamanho, disponibilidade, restrições de estilo, regras de combinação, sugestões, resumo fixo (desktop) e inferior (celular)
- Marmitas do dia por dia da semana; combos e promoções com cupons ativos
- Carrinho persistente (localStorage) com conferência de preços no servidor
- Checkout sem cadastro: entrega por bairro (com taxa e frete grátis), retirada, agendamento, cupom, Pix/cartão (Mercado Pago) ou pagamento na entrega; CEP via ViaCEP
- Acompanhamento do pedido com linha do tempo e atualização automática; busca por número + telefone
- Busca instantânea (Ctrl+K ou /), skeletons, toasts, animação do carrinho

**Painel (`/admin`)**
- Visão geral: faturamento, ticket médio, gráfico de 14 dias, mais vendidos, alertas de configuração
- Pedidos: filtros, busca, atualização a cada 15 s, alerta sonoro de novo pedido, fluxo de status validado, aviso ao cliente via WhatsApp
- Cardápio do dia: disponibilidade de pratos e ingredientes, dias da semana
- Produtos, categorias, ingredientes (com nutrição por 100 g e fonte), tamanhos (preço, multiplicador, limites, gramagens), estilos e regras de combinação, cupons
- Entrega e horários: bairros/taxas, horários, pedido mínimo, WhatsApp, banner, equipe e permissões
- Relatórios por período com exportação CSV; mensagens do formulário de contato

**Permissões:** `ADMIN` (proprietário) acessa tudo; `STAFF` (equipe) vê pedidos, disponibilidade e mensagens. O `proxy.ts` faz a checagem otimista e **toda página e ação do painel revalida o papel no banco**.

## Segurança e regras de negócio
- O servidor recalcula **tudo** antes de gravar o pedido: preços, tamanhos, regras do configurador, disponibilidade, dia do prato, horário/agendamento, área de entrega, cupom (validade, mínimo, limite de usos com update condicional), pontos e frete.
- Pagamento confirmado apenas consultando a API do Mercado Pago (webhook com assinatura HMAC `x-signature` + conferência de referência e valor). Nenhum dado de cartão passa pela loja.
- Sessão JWT (HS256) em cookie `httpOnly`/`sameSite=lax`, senhas com bcrypt (12), rate limit em login/pedidos/rastreio, checagem de origem nos POSTs, proteção contra open redirect, cabeçalhos de segurança, CSV protegido contra injeção de fórmulas.
- Link de rastreio usa token aleatório (o número do pedido sozinho não expõe dados).
- Informação nutricional nunca é estimada: aparece só quando todos os ingredientes têm os 6 valores **e** a fonte cadastrados.

## Rodando localmente

Requisitos: Node 20.19+ (testado com Node 24).

```bash
npm install
cp .env.example .env          # preencha AUTH_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD
npm run db:dev                # Postgres local do Prisma (sem Docker); copie a URL exibida para DATABASE_URL
npm run db:migrate
npm run db:seed               # dados demonstrativos + administrador do .env
npm run dev
```

Com o `prisma dev` local use `DATABASE_POOL_MAX="1"` (ele aceita uma conexão por vez). Também funciona com qualquer PostgreSQL (Docker, Neon, Supabase).

Acesse `http://localhost:3000`. O painel fica em `/admin` (login da equipe em `/entrar`, com o e-mail/senha do `.env`).

### Scripts
| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `start` | build e execução de produção |
| `npm run check` | typecheck + lint + testes |
| `npm test` | testes (Vitest) |
| `npm run db:migrate` | aplica migrations |
| `npm run db:migrate:new -- nome` | gera migration a partir do schema |
| `npm run db:seed` | dados demonstrativos (idempotente) |
| `npm run db:studio` | Prisma Studio |

### Testes
`tests/` cobre o motor de preços e validação do configurador (limites, estilos, regras, porção extra, nutrição), cupons, pontos, frete, horários/agendamento no fuso de Vitória, assinatura do webhook do Mercado Pago e helpers de segurança do painel.

## Deploy na Vercel
1. Crie um banco PostgreSQL (Supabase, Neon ou Prisma Postgres). Com Supabase: `DATABASE_URL` = pooler em modo transação (porta 6543) e `DIRECT_URL` = pooler em modo sessão (porta 5432), usada só pelas migrations.
2. Importe o repositório na Vercel. Variáveis de ambiente: `DATABASE_URL`, `DIRECT_URL` (se usar pooler), `DATABASE_POOL_MAX=5`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` (URL final), `ADMIN_EMAIL`, `ADMIN_PASSWORD` e, quando tiver, `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET`.
3. O script `vercel-build` roda `prisma generate`, `prisma migrate deploy` e `next build`.
4. Popule o banco uma vez: `DATABASE_URL="..." npm run db:seed` (pela sua máquina).
5. Mercado Pago: em *Suas integrações → Webhooks*, cadastre `https://SEU-DOMINIO/api/webhooks/mercadopago` com o evento **Pagamentos** e copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`. Teste com as credenciais de teste antes das de produção.
6. No painel, em **Entrega e horários**, cadastre o WhatsApp da loja, horários e bairros.

## Integrações pendentes (dependem do proprietário)
- **Mercado Pago:** credenciais reais. Sem elas, Pix/cartão ficam desativados e a loja aceita pagamento na entrega/retirada.
- **WhatsApp:** número da loja no painel (links `wa.me`, sem API paga).
- **Fotos (Higgsfield):** prompts e destinos em [`docs/higgsfield-prompts.md`](docs/higgsfield-prompts.md). Até lá o site exibe ilustrações vetoriais.
- **Nutrição:** dados verificados por ingrediente/produto no painel.
- Rate limit em memória: para várias instâncias, troque por Redis/Upstash.

## Estrutura
```
prisma/            schema, migrations, seed
src/app/(store)/   páginas da loja
src/app/admin/     painel
src/app/api/       carrinho, checkout, pedidos, busca, webhook
src/components/    ui (shadcn), store, admin
src/lib/           código puro: pricing, hours, validators, session, whatsapp
src/server/        serviços com banco: catalog, orders, mercadopago, reports, actions
tests/             Vitest
docs/              prompts de imagem
```
