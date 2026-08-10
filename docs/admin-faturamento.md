# Painel de faturamento (moderação) — BFF Next.js

Esta feature dá a **moderadores** um painel de receita: quanto entrou no
período, quem pagou, e para onde foi o donate. Ela lê dados que o `web-api`
acumula desde as migrations `0008_donate_shop` e `0010_donate_topup`
(`donate_topup_order`, `donate_shop_audit`, `account`, `donate_payer_profile`)
mas que até então não tinham caminho de leitura nenhum.

O Next.js é um **BFF puro**: o browser fala REST com as rotas do próprio
Next.js, que por sua vez falam gRPC+mTLS com o `web-api`
(`web.v1.DonateRevenueAdminService`). O `web-api` é a **autoridade** de
autorização e validação.

O serviço é **read-only** — não escreve nada, nem linha de auditoria. Por isso
não interage com o loop single-owner do `tmServer` e pode ser chamado à vontade.

> **Não confundir com o `binServer`.** `bin.v1.BillingService.CheckBilling` é o
> portão de *entitlement* de login e, conforme `web-platform-plan.md`,
> explicitamente **não** é a carteira de cash. Faturamento no sentido de receita
> vive aqui.

> **Risco conhecido:** o bloco proto de `DonateRevenueAdminService` foi copiado
> da branch `Jean1dev/dados-faturamento` do `w2pp-OpenWYD`, onde a
> implementação ainda estava **não commitada**. Os números e tipos de campo
> foram conferidos linha a linha contra aquele arquivo, mas quando a branch for
> mergeada vale reconferir — um mismatch corrompe silenciosamente as respostas
> em vez de dar erro (ver o histórico do campo `class` em `CLAUDE.md`).

## Topologia

```
Browser ──HTTPS──> Next.js (Route Handlers = BFF)  ──gRPC+mTLS──> web-api :7600 ──> Postgres
                                                                    ├── donate_topup_order   (dinheiro real)
                                                                    ├── donate_shop_audit    (créditos donate)
                                                                    ├── account              (identidade + carteira)
                                                                    └── donate_payer_profile (nome + CPF)
```

- O browser **nunca** fala gRPC nem vê certificado mTLS.
- `moderator_id` é **sempre** derivado do cookie de sessão (`session.accountId`),
  nunca da query string.
- O `web-api` revalida `account.role in ('moderator','admin')` em toda chamada.
  Um cookie adulterado recebe `ADMIN_RESULT_FORBIDDEN` → 403.
- Os dados vêm do Postgres (armazenamento frio). Um pedido confirmado agora
  aparece imediatamente; estado de personagem online não é relevante aqui.

## Rotas REST → RPC

Todas são `GET` e todas são somente leitura, por isso **não** chamam
`assertSameOrigin()` (mesma convenção do `GET` em `admin/world-events`).

| Rota | RPC | Query |
|------|-----|-------|
| `GET /api/admin/revenue/summary` | `GetRevenueSummary` | `from`, `to`, `bucket`, `accountId` |
| `GET /api/admin/revenue/orders` | `ListTopupOrders` | `from`, `to`, `status`, `method`, `accountId`, `limit`, `offset` |
| `GET /api/admin/revenue/top-buyers` | `ListTopBuyers` | `from`, `to`, `limit`, `offset` |
| `GET /api/admin/revenue/donate-ledger` | `ListDonateSpend` | `from`, `to`, `action`, `accountId`, `limit`, `offset` |
| `GET /api/admin/revenue/accounts` | `SearchAccounts` | `q` (mínimo 2 caracteres) |

`AdminResult` → HTTP, via `src/lib/web-api/admin-http.ts`: `OK`→200,
`FORBIDDEN`→403, `INVALID`→422, `NOT_FOUND`→404, `UNSPECIFIED`→500. Rejeição
gRPC (falha de infraestrutura) → **502**, sem vazar detalhe interno.

`NOT_FOUND` não é retornado por este serviço: uma janela sem dados é **200 com
listas vazias**, e a UI trata isso como estado distinto de erro.

### Formato dos parâmetros de janela

`from` e `to` aceitam três formas (`src/app/api/admin/revenue/_shared.ts`):

| Forma | Interpretação |
|-------|---------------|
| ausente / vazio | o servidor aplica o default (últimos 30 dias / agora) |
| unix seconds | usado como veio |
| `YYYY-MM-DD` | meia-noite de Brasília. Em `to`, é o **início do dia seguinte**, então a data final é inclusiva |
| ISO-8601 com offset | `Date.parse` |

O Brasil não tem horário de verão desde 2019, então o offset fixo `-03:00`
usado na conversão é correto e estável.

### Contrato do JSON público

- Todo `int64` sai como **string** (`id`, `accountId`, `grossCents`,
  `amountCents`, `creditsDelta`, `shopItemId`, …). Acima de 2^53 o JavaScript
  perde precisão em silêncio.
- Todo `*_unix` vira **ISO-8601**, e `0` vira **`null`**, nunca `1970-01-01`.
- `provider` **não é repassado** — ver semântica abaixo.
- As respostas ecoam `period: { from, to }` com a janela que o **servidor**
  aplicou, não a que a UI pediu.

## Validação do backend

- Janela `from >= to` → `INVALID`. Valores negativos → `INVALID`.
- Janela maior que **366 dias** → `INVALID`.

O BFF replica essas duas regras de janela (`window_invalid` /
`window_range_invalid`, ambas 422). É duplicação deliberada: sem ela, uma janela
malformada só seria detectada no `web-api` e ficaria indistinguível de uma queda
de upstream (502) quando o backend estivesse fora do ar. O `web-api` continua
sendo a autoridade.
- `limit`: default 50, máximo 100 (o BFF clampa em vez de rejeitar).
  `SearchAccounts` usa default 20, máximo 50.
- `SearchAccounts`: prefixo mínimo de 2 caracteres (o BFF já rejeita antes com
  422); é minusculizado e tem `%`/`_` escapados no servidor.
- `accountId` negativo → `INVALID`; `0`/vazio significa "todas as contas".
- `bucket` desconhecido **não é erro**: degrada para "sem série", para um portal
  mais novo não quebrar contra um servidor mais velho.

## Semântica de domínio

Esta seção é o que impede um painel numericamente correto de contar a história
errada.

1. **Receita é reconhecida em `confirmed_at`, não em `created_at`.** Um pedido
   criado em janeiro e pago em fevereiro é receita **de fevereiro**. Em janeiro
   ele aparece apenas em `createdOrders`.
2. **Os buckets fecham em `America/Sao_Paulo`** — de propósito, para bater com o
   extrato bancário. Isso diverge do resto do servidor (a regra de dia da
   recompensa diária é UTC) e é intencional. Os instantes no fio continuam
   absolutos; só a fronteira do agrupamento é BRT.
3. **Semana começa na segunda-feira** (`date_trunc('week')` do Postgres).
4. **Não existe status de reembolso nem de expirado.** Um pedido PENDING fica
   PENDING para sempre. Portanto `pendingCents` cresce monotonicamente e **não é
   dinheiro a receber** — o painel rotula o bloco como "aguardando pagamento
   (histórico)". Pela mesma razão, `paidOrders / createdOrders` é um **piso** da
   conversão, que decai com o tempo.
5. **`credit_balance` é cortesia, não receita** — valor entregue ao jogador sem
   entrada de dinheiro. O painel mostra isso em bloco separado dos KPIs.
6. **Créditos ≠ dinheiro.** `creditsSold`, `creditsSpent` e `creditsGranted`
   estão na moeda do jogo; `*Cents` está em BRL. Nunca some as duas, e não
   converta uma na outra — a taxa varia por pedido.
7. **Passivo em circulação está fora de escopo.** `TopBuyerRow.donateBalance` é
   o saldo de *uma* conta, para contexto no drill-down. Não agregue essa coluna:
   ela só vem das contas da página atual.
8. **`provider` está sempre vazio.** A coluna existe para reconciliação futura
   por gateway, mas `CreateTopupOrder` nunca a escreve. Não há breakdown por
   gateway além de `paymentMethod`. Por isso o BFF nem repassa o campo.
9. **A assimetria do `donate_shop_audit`.** Naquela tabela, `account_id` é o
   comprador quando `action='purchase'`, mas é o **moderador** quando
   `action='credit_balance'` — a conta creditada só existe no JSON. O backend
   normaliza isso em `subject` (de quem é a carteira que se moveu) e `actor`
   (quem causou), e o extrato mostra as duas colunas separadamente.
10. **CPF só existe mascarado** (`***.456.789-**`). Não há variante sem máscara
    no contrato; um chargeback se reconcilia por `externalReference`.

## Estrutura no portal

| Camada | Arquivo |
|--------|---------|
| contrato | `proto/web.proto` (bloco `DonateRevenueAdminService`, no fim) |
| tipos de fio | `src/lib/revenue/types.ts` |
| tipos do JSON público | `src/lib/revenue/http-types.ts` |
| formatação | `src/lib/revenue/format.ts` |
| cliente gRPC | `src/lib/web-api/revenue-admin-client.ts` |
| parsers + mappers | `src/app/api/admin/revenue/_shared.ts` |
| rotas | `src/app/api/admin/revenue/{summary,orders,top-buyers,donate-ledger,accounts}/route.ts` |
| página | `src/app/(portal)/admin/revenue/page.tsx` + `_data.ts` |
| UI | `src/app/(portal)/admin/revenue/_components/` |

`src/lib/revenue/format.ts` é o único lugar do repo que formata data — usa
`Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"`. `formatCents` divide
os centavos **na string**, nunca com `/ 100`, e `averageTicketCents` usa
`BigInt`. Não reuse `formatBRL` de `src/lib/donate/packages.ts` aqui: ele opera
sobre `number` e serve só aos pacotes fixos de recarga.

O filtro de conta reusa o `Combobox` de `admin/npcs/_components/`, que ganhou um
prop opcional `onQueryChange` para suportar busca remota (os outros pickers do
portal filtram um catálogo pré-carregado).

## Variáveis de ambiente (server-side)

As mesmas de [`admin-npc-editing.md`](./admin-npc-editing.md): `WEB_API_ADDR`,
`WEB_API_CA`, `WEB_API_CLIENT_CRT`, `WEB_API_CLIENT_KEY`, `WEB_API_SERVER_NAME`,
`WEB_API_INSECURE`, `SESSION_PASSWORD`. Esta feature não acrescenta nenhuma.

## Pré-requisitos operacionais

1. `web-api` no ar com `DonateRevenueAdminService` registrado — hoje isso vive
   na branch `Jean1dev/dados-faturamento` do `w2pp-OpenWYD`, ainda não mergeada.
   Sem ela, todas as rotas respondem **502**.
2. Migration **`0017_donate_revenue_indexes`** aplicada (índices de leitura;
   sem eles as consultas funcionam mas ficam lentas).
3. Pelo menos uma conta com `account.role = 'moderator'` ou `'admin'` semeada
   pelo DBA.
4. Dados em `donate_topup_order` / `donate_shop_audit` — uma base limpa retorna
   200 com listas vazias, que a UI mostra como "sem movimento no período", não
   como erro.

## Gating da UI

O login devolve `role`, que vai para `session.role`. O `TopNav` só mostra
**Admin Faturamento** para moderadores, e `page.tsx` verifica
`currentUserIsModerator()` antes de renderizar o painel. Isso é visibilidade,
não segurança: o `web-api` continua sendo a autoridade final e rechecha o papel
em toda RPC.
