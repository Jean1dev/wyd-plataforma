# Arte do portal

O visual do portal funciona sem nenhuma arte extra: molduras, cantos, brasão, ponteiras de input e chifres do botão são CSS/SVG (`src/app/globals.css`, `src/components/ui/ornaments.tsx`). Os slots abaixo trocam esses fallbacks por arte gerada por IA.

Como ativar um slot:
1. Salve o arquivo aqui em `public/assets/`.
2. Aponte o slot correspondente em `src/lib/portal-assets.ts` para ele.

| Arquivo sugerido | Slot (`PORTAL_ASSETS`) | Onde aparece | Tamanho | Prompt base |
|---|---|---|---|---|
| `hero-keyart.webp` | `heroKeyart` | Metade esquerda do login; hero do painel e do download | 2400×1400, sem texto | dark fantasy castle on a mountain at dusk, lone armored knight on ruined stone stairs, tattered red banner, misty valley, painterly, desaturated blue-grey palette with warm torch light, cinematic, no text, no logo |
| `crest.png` (fundo transparente) | `crest` | Brasão acima da moldura de login | 960×384 (proporção 5:2) | ornate dark iron dragon crest emblem with spread wings and a central gold gem, front view, symmetrical, metallic, game UI asset, transparent background |
| `panel-texture.webp` | `panelTexture` | Textura de fundo das molduras (repete) | 512×512, *tileable* | seamless dark slate stone texture with faint engraved knotwork, very low contrast, near-black blue-grey |

Dicas:
- Prefira `.webp` para fotos e ilustrações e `.png` só quando precisar de transparência.
- O key art fica atrás de gradientes escuros (esquerda e base). Deixe o ponto focal no centro ou à direita.
- A textura deve ser **muito** escura e de baixo contraste, senão compete com o texto.
