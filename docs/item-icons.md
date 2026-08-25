# Ícones e catálogo de itens

Toda tela que mostra itens usa `ItemIcon`. As RPCs de loja, recompensa, drop,
NPC e eventos continuam transportando apenas `item_index`; o Next.js faz o join
contra um catálogo central indexado por esse campo.

## Contrato e origem

`ItemCatalogService.ListItems` devolve `items`, `catalog_version` e
`icon_pack_version`. `NpcAdminService.ListItemCatalog` devolve as mesmas entradas
e versões, além de `result`.

Cada entrada contém os metadados do item, a `icon_key` opaca originada de
`itemicon.bin` e a `icon_url` HTTPS publicada pelo storage-manager. Os nomes dos
objetos no S3 são aleatórios: o frontend usa `icon_url` literalmente e nunca
analisa `icon_key` nem reconstrói uma URL a partir de chave, mesh, texture,
slot_mask, versão ou variável de ambiente.

`mesh`, `texture` e `slot_mask` continuam disponíveis como metadados, mas não
identificam a imagem. `slots` já contém a máscara decodificada e `slots[0]`
seleciona o desenho do fallback. `display_name` é o nome para exibição; `name` é
o valor cru do catálogo.

## Renderização

O fallback é o conteúdo garantido. Ele é montado primeiro e o bitmap real é
sobreposto quando existe `icon_key`, `icon_url` e `icon_pack_version`. Falha ou
404 remove a tentativa sem substituir `src` e sem repetição automática, deixando
fallback, nome e slot visíveis.

O bitmap original é exibido em 35×35 com `image-rendering: auto`, centralizado
nos contêineres `sm`, `md` e `lg`; ele não é ampliado para preencher o contêiner.
Moldura por raridade, refino, quantidade e selado são overlays independentes.

## Aquisição e cache

- No servidor, `getItemCatalog` busca a lista inteira uma vez por processo,
  deduplica chamadas concorrentes e `pickItemIcons` projeta somente os índices
  necessários antes de enviar dados a componentes client.
- No admin, `/api/admin/items` chama `ListItemCatalog`; `useItemCatalog` busca uma
  vez por aba e constrói `byIndex` para todos os editores e comboboxes.
- `catalog_version` identifica o cache de metadados e `icon_pack_version`
  identifica o mapa de URLs. Respostas válidas permanecem até o restart do
  processo ou recarga da aba.
- `catalog_version == ""` significa conteúdo não configurado e não é retido
  indefinidamente. Erros de RPC também não são cacheados como sucesso.

Catálogo vazio, `icon_pack_version`, `icon_key` ou `icon_url` vazios são estados
degradados válidos: a tela continua funcional usando o fallback.
