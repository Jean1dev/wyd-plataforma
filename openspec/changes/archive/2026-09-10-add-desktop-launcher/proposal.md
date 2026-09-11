## Why

Hoje entrar no servidor exige que o jogador execute um roteiro manual de quatro
passos documentado em `/download`: baixar um zip de um link temporário do
transfer.it, abrir o PowerShell **como administrador**, colar um comando
`netsh interface portproxy` e lembrar de removê-lo depois. Cada passo é um ponto
de desistência, e o link do transfer.it expira — quando isso acontece, ninguém
novo consegue entrar.

Um launcher desktop reduz tudo isso a instalar um programa e clicar em jogar.

## What Changes

- Novo projeto Electron em `launcher/`, dentro deste repositório, como projeto
  npm independente (não entra no `pnpm-workspace.yaml`, não é instalado junto
  com o portal).
- Na primeira execução o launcher pede ao jogador a pasta onde ficam os arquivos
  do jogo, guarda essa escolha e, se `wyd.exe` não estiver lá, baixa o zip do
  client e o instala.
- Botão **Jogar** que sobe um proxy TCP local em `127.0.0.1:8281` encaminhando
  para o servidor, e em seguida executa `wyd.exe`. O proxy roda dentro do próprio
  processo do launcher, **substituindo a necessidade do `netsh portproxy` e da
  elevação de administrador**.
- Atualização automática do launcher via `electron-updater` com provider
  `github`, publicando em GitHub Releases deste repositório.
- Pipeline de release em GitHub Actions (`windows-latest`) disparado por tag.
- Ajustes de higiene na raiz do repositório para que `launcher/` não seja
  compilado, lintado nem commitado indevidamente junto com o portal Next.js.

Fora de escopo nesta mudança: integração com as APIs gRPC (login no launcher,
notícias, personagens), patch incremental do client, assinatura de código do
instalador, e suporte a macOS/Linux.

## Capabilities

### New Capabilities

- `launcher/game-installation`: escolha e persistência da pasta do jogo,
  detecção de client já instalado, download e instalação atômica do pacote.
- `launcher/game-launch`: proxy TCP local, execução do `wyd.exe`, ciclo de vida
  do launcher enquanto o jogo roda.
- `launcher/self-update`: verificação, download e instalação de novas versões do
  próprio launcher.

### Modified Capabilities

Nenhuma. O repositório ainda não possui specs em `openspec/specs/`, e o portal
Next.js não muda de comportamento nesta mudança.

## Impact

**Novo código**

- `launcher/` — aplicação Electron completa (processo main, preload, renderer
  Vite + React + TypeScript, `electron-builder.json`).
- `.github/workflows/launcher-release.yml` — primeiro workflow do repositório.

**Arquivos existentes que precisam mudar**

- `tsconfig.json` — o `include` atual (`**/*.ts`, `**/*.tsx`) com `exclude`
  apenas de `node_modules` faria o `pnpm build` do portal typecheckar o código
  do processo main do Electron sob `lib: dom` e o plugin do Next. Precisa
  excluir `launcher`.
- `eslint.config.mjs` — `pnpm lint` roda na raiz e alcançaria `launcher/`.
- `.gitignore` — `/node_modules` e `/build` são ancorados na raiz, então
  `launcher/node_modules` e `launcher/dist_electron` entrariam no git.

**Infraestrutura**

- Bucket no **Railway Object Storage** hospedando o zip do client. O egress do
  Object Storage é gratuito, enquanto servir o arquivo por um serviço Railway
  custa US$ 0,05/GB.
- GitHub Releases deste repositório passam a ser propriedade exclusiva do
  launcher: o `electron-updater` lê sempre a release mais recente, então uma
  release criada para o portal quebraria o feed de atualização.

**Sem impacto**

- Portal Next.js, `proto/web.proto`, `web-api` e o banco não são tocados.
- A página `/download` continua funcionando como está; divulgar o launcher nela
  é uma mudança futura e separada.
