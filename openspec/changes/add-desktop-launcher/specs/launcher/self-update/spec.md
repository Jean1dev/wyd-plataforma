## Purpose

Mantém o launcher instalado atualizado sozinho, para que correções e mudanças de
configuração — como um novo endereço de servidor ou uma nova URL do pacote do
client — cheguem a quem já instalou sem exigir reinstalação manual.

## ADDED Requirements

### Requirement: Verificação automática de atualização

O launcher SHALL verificar a existência de uma versão mais nova ao iniciar, sem
ação do jogador, e SHALL fazer isso sem bloquear o uso do launcher.

A verificação SHALL ocorrer apenas na aplicação empacotada e instalada; em
execução de desenvolvimento ela NÃO SHALL ocorrer.

#### Scenario: Existe versão mais nova

- **WHEN** o launcher inicia e a versão publicada é mais nova que a instalada
- **THEN** o launcher informa que há uma atualização disponível, indicando a nova
  versão

#### Scenario: Já está atualizado

- **WHEN** o launcher inicia e a versão publicada é igual ou anterior à instalada
- **THEN** o launcher não exibe aviso de atualização

#### Scenario: Verificação falha

- **WHEN** a verificação não consegue alcançar o serviço de atualização
- **THEN** o launcher continua totalmente utilizável, incluindo instalar o client
  e jogar
- **AND** a falha não interrompe nem bloqueia nenhuma outra função

#### Scenario: Execução em desenvolvimento

- **WHEN** o launcher roda fora de uma instalação empacotada
- **THEN** nenhuma verificação de atualização é feita

### Requirement: Download e instalação sob controle do jogador

O download da atualização NÃO SHALL começar automaticamente; ele SHALL ser
iniciado pelo jogador. A instalação SHALL exigir uma segunda confirmação
explícita, porque reinicia o launcher.

#### Scenario: Jogador inicia o download

- **WHEN** o jogador aciona o download da atualização
- **THEN** o launcher baixa a nova versão exibindo o progresso
- **AND** o launcher continua utilizável durante o download

#### Scenario: Jogador instala a atualização

- **WHEN** o download termina e o jogador confirma a instalação
- **THEN** o launcher se encerra, instala a nova versão e reabre atualizado

#### Scenario: Jogador adia a instalação

- **WHEN** o download termina e o jogador não instala
- **THEN** o launcher continua utilizável na versão atual
- **AND** a atualização é aplicada quando o launcher for encerrado

#### Scenario: Download falha

- **WHEN** o download da atualização falha
- **THEN** o launcher informa a falha e permite tentar novamente
- **AND** a versão instalada continua íntegra e funcional

### Requirement: Atualização não interfere na partida

A atualização do launcher NÃO SHALL derrubar uma partida em andamento.

#### Scenario: Atualização disponível com o jogo aberto

- **WHEN** existe atualização baixada e o jogo está em execução
- **THEN** o launcher não se reinicia por conta própria
- **AND** se o jogador pedir para instalar, ele é avisado de que o jogo perderá a
  conexão antes de a instalação prosseguir

### Requirement: Origem única das atualizações

O launcher SHALL obter suas atualizações das releases publicadas no repositório
público do projeto.

Releases desse repositório SHALL pertencer exclusivamente ao launcher: a
verificação considera sempre a release mais recente, então uma release publicada
para outro componente do projeto quebraria a atualização de todos os launchers
instalados.

#### Scenario: Nova versão publicada

- **WHEN** uma nova release do launcher é publicada no repositório
- **THEN** os launchers instalados passam a detectá-la na próxima inicialização
