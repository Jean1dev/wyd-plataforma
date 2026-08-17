# Ícones de item (item-icons Fase 1)

Toda tela que mostra um item — loja de doação, recompensa diária, DropTool, editor
de loja de NPC, equipamento de template de mob, drop global de world events —
desenha o item pelo mesmo caminho: **`ItemIcon`**. Este documento explica por que o
desenho é assim, porque quase toda decisão aqui parece estranha até você saber de
onde vem a imagem.

## Resumo em uma linha

O servidor **não** tem as imagens dos itens e nunca vai ter — ele tem a **chave**
que identifica a imagem (`icon_key`). O front integra contra a chave e o
**fallback**; o pacote de imagens pluga depois por env, sem tocar em componente
nenhum.

## Por que a imagem não vem do servidor

Não existe imagem de item em nenhum dos dois repositórios: os assets gráficos
vivem dentro da pasta do cliente oficial (`WYD.exe` 7662), que não é open-source.

O que existe é a chave. Quando o **cliente** desenha um item, ele lê o mesmo
catálogo que o servidor (`STRUCT_ITEMLIST`), e os únicos campos visuais lá são
`IndexMesh`, `IndexTexture` e `nPos`:

> **A imagem do item é função de `(mesh, texture, nPos)`, não do `item_index`.**

Consequência prática: os ~3220 itens nomeados colapsam em ~1055 chaves visuais
distintas — armadura, calça, luva e bota do mesmo set compartilham o `mesh` e se
diferenciam pelo `nPos`.

`icon_key` é **opaco**. Hoje o backend a formata como
`m<mesh>_t<texture>_p<slot_mask>`, mas se a regra de endereçamento do cliente for
outra, o formato muda no servidor e o front não é tocado. **Nunca faça parse dela.**

## Contrato gRPC

```
ItemCatalogService.ListItems() → { items: ItemCatalogEntry[], catalog_version }
NpcAdminService.ListItemCatalog({ moderator_id }) → { result, items: ItemCatalogEntry[] }
```

As duas devolvem **a mesma** `ItemCatalogEntry` (mapper compartilhado no backend,
`webserver/internal/grpcsrv/itemcatalog.go`), então não podem divergir.

`ItemCatalogService` é o **único** serviço do `web-api` sem identidade: não recebe
`account_id` nem `moderator_id`, porque o catálogo é conteúdo público e imutável
lido do mount read-only `Release/` no boot — não é dado de conta. Ele quebra a
suposição, válida em todo o resto do portal, de que toda RPC carrega identidade.

| campo | tipo | uso |
|---|---|---|
| `item_index` | `int32` | id do item; é o que as outras RPCs usam |
| `name` | `string` | nome cru, com `_`. Para match; **não exiba** |
| `icon_key` | `string` | chave do pacote de ícones (~1055 valores) |
| `display_name` | `string` | é o que se exibe |
| `slot_mask` | `int32` | bitmask de onde o item **pode** ser equipado |
| `slots` | `string[]` | `slot_mask` já decodificado — **use este**, não refaça os bits |
| `grade` | `int32` | raridade; dirige a cor do fallback e a moldura |
| `mesh` / `texture` | `int32` | componentes da chave, para depuração/agrupamento por set |
| `catalog_version` | `string` | fingerprint do `ItemList.csv`; só muda em redeploy |

Todos os numéricos são `int32` → chegam como `number` em JS. (Só `int64` vira
`string`, por causa de `longs: String` no proto-loader.)

### `slot_mask`: bitmask de `Equip[16]`

| bit | valor | slot | bit | valor | slot |
|---|---|---|---|---|---|
| 0 | 1 | `face` | 8 | 256 | `accessory` |
| 1 | 2 | `helmet` | 9 | 512 | `amulet` |
| 2 | 4 | `armor` | 10 | 1024 | `orb` |
| 3 | 8 | `pants` | 11 | 2048 | `gem` |
| 4 | 16 | `gloves` | 12 | 4096 | `medal` |
| 5 | 32 | `boots` | 13 | 8192 | `fairy` |
| 6 | 64 | `weapon` | 14 | 16384 | `mount` |
| 7 | 128 | `shield` | 15 | 32768 | `cape` |

Dois casos que importam:

- **`slot_mask = 192`** (`64|128`) = arma de duas mãos, ocupa arma *e* escudo;
  `slots` vem `["weapon", "shield"]`. `ItemIcon` usa `slots[0]`, então desenha espada.
- **`slot_mask = 0`** = não equipável (poções, cupons, baús, pergaminhos), ~890
  itens; `slots` vem vazio e o fallback é a **caixa genérica** — nunca um slot chutado.

> Cuidado com a colisão de nome: no `EquipEditor`/`ShopEditor` o `slot` é o índice
> de `Equip[]`/da loja **sendo editado**. Aqui `slots` é onde o item **pode** ser
> equipado. São coisas diferentes.

Como o bit *i* da máscara é exatamente `Equip[i]`, os dois se comparam direto — é
o que o `EquipEditor` usa para **avisar** (nunca bloquear) quando o item escolhido
não pertence ao slot sendo editado. O backend não faz essa checagem: ele salva
assim mesmo. Rótulos PT-BR dos slots ficam em `src/lib/item-catalog/slots.ts`.

### `grade`

`1` Normal (cinza), `2` Místico (azul), `3` Arcano (roxo), `4` Lendário (dourado);
`0` ou desconhecido → cinza sem rótulo. Mapa em `src/lib/item-catalog/grade.ts`.

## Renderização: o fallback é o caminho normal

```
icon_key ──> <NEXT_PUBLIC_ITEM_ICON_BASE>/<icon_key>.webp   (Fase 2 — não existe hoje)
                  │ env ausente, 404 ou item desconhecido
                  └──> ícone lucide por slots[0], tingido por grade
```

**O fallback não é temporário.** Ele cobre: itens novos do servidor que nunca
existiram no cliente original, lacunas do pacote, índice fora do catálogo e o modo
degradado abaixo. A imagem real é enfeite por cima.

Hoje `NEXT_PUBLIC_ITEM_ICON_BASE` não é definida em lugar nenhum, então
`ItemIcon` renderiza o fallback **direto** — sem disparar um 404 por item. Quando
o pacote existir, basta definir a env; o `onError` cobre as chaves faltantes.

Refino (`+1..+9`), moldura por `grade`, quantidade e marca de "selado" são
**overlay em CSS/SVG**, nunca assados na imagem: assar multiplicaria o pacote por
10, e refino é estado por *instância* do item — o catálogo nem carrega isso.

## Modo degradado (obrigatório tratar)

Sem `-content`/`W2PP_CONTENT` no `web-api`, `ListItems` devolve **lista vazia e
nenhum erro** (mesma degradação dos pickers de moderação). Falha de gRPC degrada
igual. Em ambos os casos toda tela mostra a caixa genérica e continua funcionando.
**Catálogo vazio nunca é erro de tela.**

## Como as telas obtêm os dados

`DonateShopItem`, `DailyRewardItem`, `AdminNpcShopItem`, `DropItemEntry` e
`MobDropItem` **não** carregam campos visuais — são mensagens distintas. Sempre
**join por `item_index`**, em vez de pedir que cada RPC duplique `icon_key`.

Há dois caminhos, um por lado:

| lado | módulo | uso |
|---|---|---|
| **server** | `src/lib/item-catalog/catalog.ts` | `pickItemIcons(indexes)` projeta o catálogo para o que a tela mostra e passa como prop. Usado por `/loja` e `/recompensas`. |
| **browser** | `admin/npcs/_components/catalog.ts` | `useItemCatalog()` já carregava o catálogo inteiro para os comboboxes; agora também expõe `byIndex`. Usado pelas telas de admin. |

Os dois projetam pelo mesmo mapper, `src/lib/item-catalog/view.ts`
(`toItemIconData`), então não podem divergir.

**Nunca** passe o catálogo inteiro para um client component a partir do servidor:
são ~3,2k entradas (~400 KB). Use `pickItemIcons` primeiro. No admin isso não se
aplica — lá o browser já baixa a lista toda de propósito, para o combobox filtrar
localmente.

### Cache

O catálogo é imutável em runtime (o `Release/` é mount read-only e o `web-api` lê
uma vez no boot), então `catalog_version` só muda em redeploy. Por isso o cache dos
dois lados é um simples memo por processo/aba — não há janela de revalidação para
calibrar, e nada aqui usa `use cache`/`cacheLife`.

**Uma exceção:** o resultado do modo degradado **não** é cacheado. Ele vem com
`catalog_version = ""`, e se o `web-api` for redeployado com conteúdo, um processo
que tivesse cacheado o vazio continuaria servindo mapa vazio — ícones presos no
fallback, silenciosamente — até reiniciar. `version === ""` é a checagem barata.
Chamadas concorrentes a frio compartilham um único request (dedupe de in-flight),
senão N renders puxariam N × ~400 KB antes do primeiro cache.

## Fora de escopo (não existe ainda)

- **O pacote de imagens.** É a Fase 2, e depende de (a) confirmar como o cliente
  endereça o ícone e (b) uma decisão do dono do projeto sobre distribuir assets
  extraídos do cliente oficial. Até lá, 100% fallback.
- **Inventário/equipamento do personagem.** `ListMyCharacters` devolve só o resumo;
  mostrar inventário com ícones exigiria uma RPC que não existe.
- **Render 3D dos meshes** para alta resolução (Fase 3, opcional).
