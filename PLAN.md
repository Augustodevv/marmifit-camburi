# PLAN — Marmifit Camburi

## Ambiente analisado
- Node 24, npm 11, Git, GitHub CLI autenticado, Vercel CLI 64 (precisa de `vercel login`), Docker instalado (daemon parado).
- Banco local: `npx prisma dev` (Postgres local do Prisma, sem Docker).
- Next.js 16.4 (App Router, Turbopack, `proxy.ts` no lugar de `middleware.ts`), React 19.3, Tailwind 4, shadcn/ui (base-nova / Base UI), Prisma 7.10 (driver adapter `pg`), Zod 4, Framer Motion, Lucide, Zustand, jose + bcryptjs, Vitest.

## Arquitetura
```
src/
  app/                rotas (loja, conta, admin, api)
  components/         UI (ui/ = shadcn), loja, admin
  lib/                código puro e compartilhado (pricing, hours, validators, session)
  server/             serviços com acesso ao banco (catalog, orders, mercadopago)
  generated/prisma/   Prisma Client (gerado, fora do git)
prisma/               schema, migrations, seed
tests/                Vitest
docs/                 prompts Higgsfield
public/images/        destino das fotos geradas
```
Regra de ouro: **o servidor recalcula tudo** (preço, disponibilidade, regras, cupom, frete, pontos, horário) a partir do banco antes de gravar o pedido ou abrir o pagamento. O preço exibido no navegador usa o mesmo motor (`src/lib/pricing.ts`) só para feedback instantâneo.

## Modelos (prisma/schema.prisma)
User, Address, Category, Size, Style, Ingredient (com nutrição por 100 g opcional), CombinationRule, Product, Coupon, DeliveryZone, StoreSettings, Order, OrderItem, OrderEvent, Favorite, Review, Notification, ContactMessage.

## Prioridades e status
### P0 — fluxo principal
- [x] Schema, migration e seed demonstrativo
- [x] Motor de preço/validação do configurador + testes
- [x] Horários/agendamento + testes
- [x] Serviço de pedidos com recálculo no servidor
- [x] Mercado Pago (Checkout Pro, webhook com assinatura HMAC, conferência de valor) + teste da assinatura
- [x] Cardápio, página do produto, configurador, carrinho, checkout, acompanhamento
- [x] Painel: pedidos em tempo quase real e mudança de status

### P1 — operação
- [x] Auth (cadastro, login, sessão JWT httpOnly, proteção do /admin via proxy + checagem no servidor)
- [x] Admin: produtos, ingredientes, tamanhos, estilos, regras, categorias, cupons, entrega/horários, relatórios
- [x] Área do cliente: pedidos, pedir novamente, favoritos, endereços, pontos, notificações

### P2 — diferenciais e qualidade
- [x] Marmitas do dia, combos/promoções, institucional, contato
- [x] Avaliações verificadas, recomendações, busca instantânea
- [x] SEO (metadata, sitemap, robots, JSON-LD), acessibilidade, skeletons
- [x] README, .env.example, deploy (GitHub + Vercel)

## Pendências que dependem do proprietário
- Credenciais reais do Mercado Pago (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`).
- Número de WhatsApp da loja (cadastrado no painel → Configurações).
- Fotos geradas no Higgsfield (prompts em `docs/higgsfield-prompts.md`).
- Informação nutricional verificada de cada ingrediente/produto.

## Registro
- Etapa 1: ambiente, scaffold, schema, seed, regras de negócio e 24 testes unitários passando.
- Nota técnica: o `prisma dev` local (PGlite) expõe um único banco e o shadow DB não funciona bem com `migrate dev`. Fluxo adotado: `npm run db:migrate:new <nome>` (gera SQL via `migrate diff`) + `prisma migrate deploy`.
- Etapa 2: loja completa (14 páginas), configurador em 7 etapas, carrinho/checkout com recálculo no servidor, Mercado Pago, auth, área do cliente.
- Etapa 3: painel administrativo (pedidos, cardápio do dia, produtos, categorias, ingredientes, tamanhos, estilos/regras, cupons, configurações, relatórios/CSV, mensagens, equipe).
- Validação: typecheck e lint limpos, 28 testes passando, `next build` ok. Fluxo testado no navegador: configurador → carrinho → checkout → pedido MF00002 → painel → Em preparo → Saiu para entrega → Entregue.
- Deploy: GitHub + Vercel (ver README).
