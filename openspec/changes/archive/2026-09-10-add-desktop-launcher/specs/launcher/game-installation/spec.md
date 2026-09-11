## Purpose

Garante que o jogador tenha os arquivos do client do WYD numa pasta conhecida do
seu computador, escolhida por ele, baixando e instalando o pacote automaticamente
quando eles ainda não existem.

## ADDED Requirements

### Requirement: Escolha da pasta do jogo

O launcher SHALL exigir que o jogador defina uma pasta para os arquivos do jogo
antes de qualquer download ou execução, e SHALL persistir essa escolha entre
execuções.

A pasta sugerida por padrão NÃO SHALL estar dentro de `Program Files` nem de
qualquer diretório que exija privilégio de administrador para escrita, porque o
client escreve arquivos dentro da própria pasta durante a execução.

#### Scenario: Primeira execução sem pasta configurada

- **WHEN** o launcher abre e não existe pasta do jogo persistida
- **THEN** o launcher exibe a tela de configuração inicial com um seletor de
  pasta e uma sugestão padrão fora de `Program Files`
- **AND** o botão de jogar permanece indisponível até a pasta ser definida

#### Scenario: Execuções seguintes

- **WHEN** o launcher abre e já existe pasta do jogo persistida
- **THEN** o launcher usa essa pasta sem perguntar novamente

#### Scenario: Jogador troca a pasta

- **WHEN** o jogador escolhe uma pasta diferente nas configurações
- **THEN** o launcher passa a usar a nova pasta e reavalia a presença do client
  nela

#### Scenario: Pasta configurada não existe mais

- **WHEN** o launcher abre e a pasta persistida foi apagada ou está inacessível
- **THEN** o launcher trata como client ausente e oferece instalar novamente ou
  escolher outra pasta

### Requirement: Detecção do client instalado

O launcher SHALL considerar o client instalado quando, e somente quando,
`wyd.exe` existir na raiz da pasta do jogo.

#### Scenario: Client presente

- **WHEN** `wyd.exe` existe na pasta do jogo
- **THEN** o launcher não baixa nada e habilita o botão de jogar

#### Scenario: Client ausente

- **WHEN** `wyd.exe` não existe na pasta do jogo
- **THEN** o launcher oferece baixar e instalar o client

### Requirement: Download e instalação atômica do client

Quando o client estiver ausente, o launcher SHALL baixar o pacote a partir de
uma URL configurada e instalá-lo de forma atômica: os arquivos SHALL aparecer na
pasta do jogo somente após a extração ter terminado com sucesso por completo.

Uma instalação interrompida por qualquer motivo NÃO SHALL deixar `wyd.exe` na
pasta do jogo, para que a detecção de client instalado nunca dê falso positivo
sobre uma instalação parcial.

#### Scenario: Instalação bem-sucedida

- **WHEN** o jogador confirma a instalação e o download e a extração terminam
  sem erro
- **THEN** os arquivos do client passam a existir na pasta escolhida
- **AND** o launcher habilita o botão de jogar

#### Scenario: Download interrompido

- **WHEN** a conexão cai ou o download falha no meio
- **THEN** o launcher informa a falha e oferece tentar novamente
- **AND** `wyd.exe` não existe na pasta do jogo
- **AND** nenhum arquivo temporário parcial permanece ocupando disco

#### Scenario: Extração interrompida

- **WHEN** a extração falha no meio, por erro de disco ou pacote corrompido
- **THEN** o launcher informa a falha e oferece tentar novamente
- **AND** `wyd.exe` não existe na pasta do jogo

#### Scenario: Launcher é fechado durante a instalação

- **WHEN** o jogador fecha o launcher enquanto o download ou a extração está em
  andamento
- **THEN** na próxima abertura o launcher detecta o client como ausente e oferece
  instalar novamente

### Requirement: Progresso visível da instalação

O launcher SHALL informar o andamento da instalação de forma contínua, sem
períodos em que a interface pareça travada.

#### Scenario: Durante o download

- **WHEN** o download está em andamento
- **THEN** o launcher exibe o percentual concluído e o total baixado
- **AND** a janela continua respondendo

#### Scenario: Durante a extração

- **WHEN** a extração está em andamento
- **THEN** o launcher indica que está extraindo
- **AND** a janela continua respondendo

### Requirement: Espaço em disco insuficiente

O launcher SHALL falhar de forma explícita quando não houver espaço em disco
suficiente, em vez de produzir uma instalação parcial.

#### Scenario: Disco cheio durante a instalação

- **WHEN** o disco fica sem espaço durante o download ou a extração
- **THEN** o launcher informa que faltou espaço em disco
- **AND** remove os arquivos temporários que criou
- **AND** `wyd.exe` não existe na pasta do jogo
