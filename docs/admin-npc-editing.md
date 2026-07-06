# Edição de NPCs (moderação) — BFF Next.js

Esta feature permite que **moderadores** editem a configuração fria dos NPCs
(visibilidade, posição e loja/preço) a partir do portal. O Next.js é um **BFF
puro**: o browser fala REST com as rotas do próprio Next.js, que por sua vez
falam gRPC+mTLS com o `web-api` (`web.v1.NpcAdminService`). O `web-api` é a
**autoridade** de autorização e validação.

## Topologia

```
Browser ──HTTPS──> Next.js (Route Handlers = BFF)  ──gRPC+mTLS──> web-api :7600 ──> Postgres
```

- O browser **nunca** fala gRPC nem vê certificado mTLS.
- `moderator_id` é **sempre** derivado do cookie de sessão (`session.accountId`),
  nunca do corpo enviado pelo browser.
- Um `player` recebe `ADMIN_RESULT_FORBIDDEN` do `web-api` → 403 no BFF.

## Rotas REST → RPC

| Método + rota | RPC |
|---------------|-----|
| `GET /api/admin/npcs` | `ListNpcs` |
| `POST /api/admin/npcs` | `UpsertNpc` (criar) |
| `GET /api/admin/npcs/:id` | `GetNpc` |
| `PUT /api/admin/npcs/:id` | `UpsertNpc` (editar) |
| `DELETE /api/admin/npcs/:id` | `DeleteNpc` |
| `PATCH /api/admin/npcs/:id/visibility` | `SetNpcVisibility` |
| `PUT /api/admin/npcs/:id/shop` | `SetNpcShop` |
| `PUT /api/admin/items/:index/price` | `SetItemPrice` |

`AdminResult` → HTTP: `OK`→200, `FORBIDDEN`→403, `INVALID`→422, `NOT_FOUND`→404,
`UNSPECIFIED`→500. Rejeição de gRPC (falha de infra) → **502**.

## Semântica de domínio

- **`merchant`** (tipo do NPC): `0` não-merchant, `1` loja normal, `2` guarda-carga,
  `19` loja tipo 3, `100` NPC de quest. Outros valores → `INVALID`.
- **Loja**: 27 slots (`0..26`) em **3 abas de 9** (`0..8` / `9..17` / `18..26`).
  `SetNpcShop` **substitui a loja inteira** — slots omitidos ficam vazios.
  `slot` único em `[0,26]`; `item_index > 0`.
- **Preço**: `SetItemPrice(item_index, price)` é **global por item** (vale em todos
  os NPCs). `price >= 0` define o override; `price < 0` limpa e volta ao catálogo.
- **Propagação**: a escrita vai para o Postgres na hora, mas o jogo só reflete
  quando o **tmServer recarrega** (boot + poll ~15s). Requer o overlay ligado
  (`W2PP_NPC_EDITING=true`). A UI avisa o moderador disso após cada operação.

## Variáveis de ambiente (server-side)

| Var | Descrição |
|-----|-----------|
| `WEB_API_ADDR` | host:porta do web-api (ex. `web-api:7600`, default `localhost:7600`) |
| `WEB_API_CA` | caminho do CA (PEM) que valida o web-api (mTLS) |
| `WEB_API_CLIENT_CRT` / `WEB_API_CLIENT_KEY` | par cliente (PEM) para o mTLS |
| `WEB_API_SERVER_NAME` | override do SNI/target name do certificado (opcional) |
| `WEB_API_INSECURE` | `1` desliga TLS (apenas dev/local) |
| `SESSION_PASSWORD` | senha de assinatura/criptografia do cookie `iron-session` |

> O par cliente só é usado quando `WEB_API_CA`/`WEB_API_CLIENT_KEY`/`WEB_API_CLIENT_CRT`
> estão definidos (link direto ao webserver). Atrás de um edge HTTPS público
> (ex. Railway) não há cert cliente a apresentar e o TLS é padrão.

## Pré-requisitos operacionais

1. **web-api no ar** (`webserver`, `:7600`) com mTLS, migrations aplicadas
   (`0005_npc_editing`).
2. **Conta de moderador**: `account.role` precisa ser `'moderator'` ou `'admin'`.
   Não há RPC para promover — é operação de DBA/seed:
   `UPDATE account SET role='moderator' WHERE name=...`.
3. **Seed dos NPCs** (uma vez): `dbserver import-npcs -content <Release/> -dsn <dsn>`.
   Antes disso, `ListNpcs` volta vazio.
4. **Overlay no tmServer**: `W2PP_NPC_EDITING=true`.

## Gating da UI

O login (`AccountWebService.VerifyCredentials`) devolve `role`, guardado na sessão
(`session.role`). A UI de admin e o link de navegação só aparecem para
`moderator`/`admin`; o `web-api` continua sendo a autoridade final (mesmo se a UI
falhar em esconder algo, o `web-api` retorna `FORBIDDEN`).
