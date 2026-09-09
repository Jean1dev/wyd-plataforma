## Context

Ver `proposal.md` — Why para a motivação.

Restrições que moldam o desenho:

- O repositório `Jean1dev/wyd-plataforma` é público, tem **zero tags e nenhum
  workflow** — o espaço de GitHub Releases está livre.
- A raiz do repositório é um app Next.js cujo `tsconfig.json` usa
  `include: ["**/*.ts", "**/*.tsx"]` com `exclude: ["node_modules"]`, e cujo
  `eslint.config.mjs` roda a partir da raiz. O `.gitignore` ancora
  `/node_modules` e `/build` na raiz.
- O `pnpm-workspace.yaml` existe mas não declara `packages:`, então um
  subprojeto npm em `launcher/` fica naturalmente fora do `pnpm install` do
  portal.
- Os parâmetros de conexão são os já publicados em `src/lib/portal-data.ts`:
  encaminhar `127.0.0.1:8281` para `66.33.22.224:56950`.
- A máquina de desenvolvimento é Linux; o alvo é exclusivamente Windows.
- Existe um projeto de referência funcionando, `crypto-easy-connect`, com
  Electron + Vite + React + TypeScript, `electron-builder` e `electron-updater`.

## Goals / Non-Goals

**Goals:**

- Reaproveitar a estrutura já validada em `crypto-easy-connect` em vez de
  inventar uma nova, reduzindo o desenho a um problema de adaptação.
- Zero prompt de elevação no caminho feliz.
- Isolar `launcher/` do portal de forma que nenhum comando existente do portal
  (`pnpm build`, `pnpm lint`, `pnpm typecheck`) mude de resultado.
- Deixar a porta aberta para a integração gRPC futura sem construí-la agora.

**Non-Goals:**

- Não desenhar aqui a integração gRPC, o patch incremental de client, nem
  suporte a outros sistemas operacionais.
- Não substituir a página `/download` do portal; ela continua como está.
- Não introduzir workspace pnpm nem monorepo tooling.

## Decisions

### Proxy TCP em user-land no lugar do `netsh portproxy`

O launcher sobe um servidor TCP em `127.0.0.1:8281` no próprio processo main do
Electron e encaminha cada socket para o servidor de jogo. Do ponto de vista do
`wyd.exe` isso é indistinguível da regra `portproxy`.

**Por que, e não o `netsh` que está na documentação:** o `netsh interface
portproxy` exige administrador, o que significa um prompt de UAC a cada clique em
jogar. Elevar o launcher inteiro é pior — quebra o `electron-updater`, que
assume instalação por usuário, e faria o `wyd.exe` herdar privilégio de
administrador. Além disso o `netsh` depende do serviço IP Helper (`iphlpsvc`)
estar ativo, o comando `add` falha quando a regra já existe, e a regra sobrevive
ao fechamento do jogo — hoje o site precisa pedir ao jogador que a remova
manualmente.

**Alternativas consideradas:**

- *`netsh` elevado por comando*: elevar só o `netsh` via PowerShell mantém o
  launcher sem privilégio, mas o UAC a cada partida continua, junto com a
  dependência do `iphlpsvc` e o resíduo na máquina.
- *Reconfigurar o endereço dentro do client*: eliminaria o encaminhamento por
  completo, mas depende de o endereço do servidor ser configurável no client, o
  que a existência da instrução de portproxy sugere que não é.

**Custo aceito:** o launcher precisa ficar aberto durante a partida. Isso é
comportamento normal de launcher, e o aviso ao fechar (spec `game-launch`)
cobre o caso de o jogador não perceber.

### Presença de `wyd.exe` como única checagem, com instalação atômica

A detecção de client instalado é apenas "`wyd.exe` existe na raiz da pasta". Não
há manifesto, versão nem hash.

**Por que:** é a checagem mais barata possível e serve à v1, onde não existe
patch de client. Um manifesto seria infraestrutura sem uso hoje.

**O que torna isso seguro:** a falha clássica dessa abordagem é uma instalação
interrompida deixar um `wyd.exe` quebrado no lugar, e o launcher nunca mais
tentar baixar. A instalação atômica remove essa falha sem custo de complexidade:
baixar para arquivo temporário, extrair para um diretório temporário dentro da
pasta do jogo, e só então mover para o destino final. O `wyd.exe` passa a existir
num único passo indivisível.

**Alternativa considerada:** manifesto remoto com `sha256` do pacote. Descartado
para a v1 — a instalação atômica já cobre o modo de falha que ele evitaria, e o
manifesto só passa a valer a pena quando existir patch incremental.

### Pacote do client no Railway Object Storage, não num serviço Railway

O zip fica no Object Storage do Railway, com a URL guardada na configuração da
aplicação.

**Por que:** egress de serviço no Railway custa US$ 0,05/GB, enquanto o Object
Storage tem **egress gratuito** (armazenamento a US$ 0,015 por GB/mês). Servir o
client por um serviço faria o custo crescer proporcionalmente ao sucesso do
servidor; pelo Object Storage ele é praticamente fixo.

**Alternativas consideradas:**

- *`public/` do portal Next.js*: o arquivo entraria no git e no build do portal.
- *Asset de GitHub Release*: seria gratuito e cabe no limite de 2 GB, mas
  colocaria o pacote do client no mesmo espaço de releases que o
  `electron-updater` consome, contrariando a decisão de manter esse espaço
  exclusivo do launcher.
- *Link atual do transfer.it*: temporário por natureza, é justamente o problema
  que a mudança resolve.

**Consequência do tamanho:** com o pacote abaixo de 500 MB, retomada de download
por `Range` fica fora da v1 — uma falha resulta em nova tentativa do zero.

### Estrutura espelhando `crypto-easy-connect`

Electron + Vite + React + TypeScript; processo main em módulos separados sob
`launcher/electron/`, um por domínio; renderer em `launcher/src/`; configuração
do `electron-builder` num `electron-builder.json` separado do `package.json`;
`contextIsolation: true`, `nodeIntegration: false` e API exposta por
`contextBridge`; persistência em JSON simples dentro de `app.getPath('userData')`,
sem `electron-store`.

**Por que:** é uma estrutura já em produção e conhecida, e cada decisão dela
(inclusive `asarUnpack` dos arquivos do main) já foi paga uma vez.

**Divergência deliberada:** o `crypto-easy-connect` usa `provider: "generic"`
apontando para um blob do Azure, com o CI injetando a URL antes do build. Aquilo
existe porque o repositório é privado e o `electron-updater` recebe 404 nos
assets de release sem autenticação. Aqui o repositório é público, então
`provider: "github"` funciona direto e todo esse contorno — blob, secret de
storage, passo de injeção de URL — desaparece.

### GitHub Releases exclusivas do launcher

O `electron-updater` com provider `github` consome sempre a release mais recente
do repositório. Como o repositório também hospeda o portal, fica estabelecido
que releases desse repositório pertencem ao launcher. Nenhuma tag existe hoje,
então nada precisa ser migrado.

**Alternativa considerada:** publicar o launcher como pré-release e o portal como
release estável, aproveitando que `/releases/latest` ignora pré-releases. É
frágil e inverte a semântica de pré-release; descartado.

### Build por GitHub Actions em `windows-latest`

O empacotamento NSIS roda em runner Windows, disparado por push de tag, com
`electron-builder --publish always` usando o token do próprio Actions.

**Por que:** a máquina de desenvolvimento é Linux e gerar instalador NSIS de lá
exige Wine. Fora isso, é o mesmo caminho já usado no projeto de referência.

### Isolamento do subprojeto na raiz

Três ajustes pontuais: `launcher` entra no `exclude` do `tsconfig.json`, nos
`globalIgnores` do `eslint.config.mjs`, e `launcher/node_modules`,
`launcher/dist` e `launcher/dist_electron` entram no `.gitignore`.

**Por que:** sem o primeiro, `pnpm build` do portal typecheca o processo main do
Electron sob `lib: dom` e o plugin do Next, e quebra. Sem o terceiro, as
dependências e os artefatos de build do Electron entram no git, porque as regras
atuais são ancoradas na raiz.

## Risks / Trade-offs

- **Porta 8281 já ocupada por uma regra `portproxy` que o jogador criou seguindo
  as instruções atuais do site** → o erro de bind é detectado e traduzido numa
  mensagem específica que inclui o comando de remoção, já que remover a regra
  exige administrador. É o modo de falha mais provável entre os jogadores atuais.

- **Instalador sem assinatura digital dispara o SmartScreen** → aceito na v1,
  como no projeto de referência. O jogador precisa clicar em "Mais informações →
  Executar assim mesmo". Mitigação de produto: documentar isso na página
  `/download` quando o launcher for divulgado.

- **Não é possível validar o fluxo real na máquina de desenvolvimento Linux** →
  a interface e o proxy TCP são testáveis no Linux, mas NSIS, SmartScreen,
  `wyd.exe` e o encaminhamento com o client real exigem uma máquina ou VM
  Windows. Precisa estar previsto no plano de tarefas, não descoberto no fim.

- **Sem patch de client na v1** → se os arquivos do jogo mudarem, quem já
  instalou não recebe a atualização e precisa apagar a pasta. Aceito enquanto o
  servidor está em fase inicial; a capability `game-installation` está escrita
  de forma a comportar um manifesto depois sem reescrever o contrato.

- **Uma release do portal publicada por engano quebra a atualização de todos os
  launchers instalados** → mitigado por convenção documentada, não por
  mecanismo. Se o portal passar a precisar de releases, o provider precisa
  mudar para `generic` com feed próprio.

- **O launcher fica aberto durante a partida e pode ser fechado sem querer** →
  aviso explícito de confirmação antes de fechar com o jogo rodando.

## Migration Plan

Não há migração de dados nem de usuários: é um artefato novo, distribuído em
paralelo às instruções manuais que já existem.

1. Subir o zip do client no Railway Object Storage e obter a URL pública.
2. Publicar a primeira release do launcher.
3. Manter a página `/download` inalterada, com as instruções manuais, até o
   launcher ter sido validado com jogadores reais.
4. Divulgar o launcher na `/download` como mudança separada.

**Rollback:** despublicar a release. As instruções manuais em `/download` nunca
deixaram de funcionar, então nenhum jogador fica sem caminho de entrada.

## Open Questions

- Qual a URL final do pacote no Railway Object Storage. Não trava a
  implementação: a URL é configuração da aplicação.
- Confirmar, numa máquina Windows com o client real, que `wyd.exe` é o
  executável de entrada e que `8281` é a única porta que o client abre. As
  instruções atuais do site mapeiam apenas essa porta, o que indica que sim. Se
  houver outras portas, a spec `game-launch` precisa contemplá-las.
