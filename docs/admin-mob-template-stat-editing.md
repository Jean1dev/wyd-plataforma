# Edição de stats de mob/NPC (moderação) — BFF Next.js

Esta feature permite que **moderadores** editem os stats de combate (level,
HP/MP, atributos, EXP, skills, equipamento) de templates `npc/<template_name>`
a partir do portal — o equivalente web da ferramenta legada Win32
`EDITAPPMOB`. É irmã de [`admin-npc-editing.md`](./admin-npc-editing.md), que
edita posição/visibilidade/loja; esta edita tudo o resto, **exceto**
`Carry[]` (loja, `NpcAdminService.SetNpcShop`) e a posição de spawn gerida
pelo banco (`NpcAdminService.UpsertNpc`). O Next.js é um **BFF puro**: o
browser fala REST com as rotas do próprio Next.js, que por sua vez falam
gRPC+mTLS com o `web-api` (`web.v1.MobTemplateAdminService`). O `web-api` é a
**autoridade** de autorização e validação.

> **Risco conhecido:** o bloco proto de `MobTemplateAdminService` neste repo
> foi escrito a partir da especificação funcional da feature (issue #167), não
> copiado byte-a-byte do `api/web/v1/web.proto` real do backend. Antes de
> considerar este contrato definitivo, valide os números/tipos de campo contra
> o proto real do `w2pp-OpenWYD` — um mismatch corrompe silenciosamente as
> respostas, não dá erro de build (ver aviso em `CLAUDE.md` sobre o histórico
> do campo `class`).

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
| `GET /api/admin/mob-templates` | `ListMobTemplates` |
| `GET /api/admin/mob-templates/:name` | `GetMobTemplateStat` |
| `PUT /api/admin/mob-templates/:name` | `UpsertMobTemplateStat` |
| `DELETE /api/admin/mob-templates/:name` | `DeleteMobTemplateStat` |
| `PUT /api/admin/mob-templates/:name/equip` | `SetMobTemplateEquip` |

Não há `POST`: não existe "criar template novo" nesta UI (templates vêm de
arquivos já existentes em `npc/`). `:name` é o `template_name` (string, o
próprio arquivo), não um id numérico — precisa de `encodeURIComponent` no
client e é decodificado automaticamente pelo Next.js App Router no servidor.

`AdminResult` → HTTP: `OK`→200, `FORBIDDEN`→403, `INVALID`→422, `NOT_FOUND`→404,
`UNSPECIFIED`→500. Rejeição de gRPC (falha de infra) → **502**.

## Pickers do formulário (lookups)

- **`ListMobTemplates`** → combobox pesquisável de `template_name` que serve
  de página de busca (`/admin/mob-templates`). **Diferente de
  `ListMerchantTemplates`: não é filtrada por merchant** — traz todo arquivo
  em `npc/`, então o caso de uso principal são monstros comuns
  (rebalanceamento), não só lojistas.
- **`ListItemCatalog`** → reaproveitado tal como está da feature de NPCs
  (mesmo RPC, mesmo hook `catalog.ts`) para o `item_index` de cada slot de
  equipamento.

**Degradação graciosa (importante):** `templates = []` é resposta **válida**
(`result = OK`) quando o `webserver` roda **sem** `-content`/`W2PP_CONTENT`.
Nesse caso a UI cai no **campo manual** com aviso — **não** é erro.

## Semântica de domínio

- **Dois campos "merchant" com significados diferentes**: o `merchant` desta
  feature é o `STRUCT_MOB.Merchant` cru do **template** (qualquer arquivo em
  `npc/`); o `merchant` de `NpcAdminService.AdminNpc` é a classificação de
  loja da **definição** de NPC gerida pelo banco. Editar um não muda o outro
  — rotulados como "Tipo de merchant (template)" na UI para não confundir.
- **`overridden = false` é estado normal, não erro.** `GetMobTemplateStat` faz
  leitura through: sem override salvo, devolve os valores crus do arquivo com
  `overridden = false` — a UI já abre com os valores reais, não com um
  formulário vazio. Salvar (`Upsert`) cria o primeiro override.
- **EXP**: aviso (não bloqueio) na UI se `exp == 0` ou `exp > 10.000.000` num
  monstro real (`level >= 1 && merchant == 0`) — sinal de template mal
  calibrado.
- **`spx`/`spy`**: posição embutida no próprio template — distinta de
  `pos_x`/`pos_y` da definição do NPC no banco (`NpcAdminService.UpsertNpc`).
- **Equipamento**: `Equip[16]` (slots `0..15`). `SetMobTemplateEquip`
  **substitui a lista inteira** — slots omitidos ficam vazios, não mantêm o
  valor antigo. **Requer que já exista um override** para o template (salve
  os stats pelo menos uma vez primeiro) — sem isso, `ADMIN_RESULT_NOT_FOUND`.
  `slot` único em `[0,15]`; `item_index > 0`.
- **Deletar**: `DeleteMobTemplateStat` remove só o override — o template volta
  a usar os valores crus do arquivo. **Nunca** apaga o arquivo `npc/<nome>`
  (`Release/` é montado read-only em produção).

## Sem hot-reload (diferença importante em relação à edição de NPC)

Diferente do `NpcAdminService` (que recarrega via poll do tmServer em
~15s), stats de mob **só são aplicados no boot** do tmServer, e só quando ele
sobe com a flag `-mob-stat-editing`. Não existe "aplicar agora" — a UI mostra
um aviso fixo disso em toda página da feature. Se uma edição salva não aparece
no jogo, o primeiro suspeito é essa flag ausente, não o BFF.

## Variáveis de ambiente (server-side)

Mesmas do resto do BFF (processo único, não há env var específica desta
feature) — ver a tabela completa em
[`admin-npc-editing.md`](./admin-npc-editing.md#variáveis-de-ambiente-server-side):
`WEB_API_ADDR`, `WEB_API_CA`/`WEB_API_CLIENT_CRT`/`WEB_API_CLIENT_KEY`,
`WEB_API_SERVER_NAME`, `WEB_API_INSECURE`, `SESSION_PASSWORD`.

## Pré-requisitos operacionais

1. **web-api no ar** com mTLS e migrations desta feature aplicadas (nome a
   confirmar com o backend).
2. **Conta de moderador**: `account.role = 'moderator'` ou `'admin'` (mesmo
   seed manual de DBA da feature de NPCs).
3. **Pickers**: `ListMobTemplates` e `ListItemCatalog` só vêm preenchidos se o
   `webserver` subir com `-content <Release/>`/`W2PP_CONTENT`. Sem isso,
   respondem `OK` com lista vazia e a UI cai no campo manual.
4. **Overlay no tmServer**: `-mob-stat-editing` — sem essa flag, os overrides
   salvos aqui nunca são aplicados, mesmo após restart.

## Gating da UI

O login (`AccountWebService.VerifyCredentials`) devolve `role`, guardado na
sessão (`session.role`). A UI de admin e o link de navegação só aparecem para
`moderator`/`admin`; o `web-api` continua sendo a autoridade final (mesmo se a
UI falhar em esconder algo, o `web-api` retorna `FORBIDDEN`).
