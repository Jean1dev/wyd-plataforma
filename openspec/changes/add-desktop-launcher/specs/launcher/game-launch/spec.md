## Purpose

Coloca o jogador dentro do jogo com um clique, abrindo o caminho de rede até o
servidor sem exigir privilégio de administrador e mantendo esse caminho de pé
enquanto o jogo estiver rodando.

## ADDED Requirements

### Requirement: Caminho de rede até o servidor sem elevação

Ao iniciar o jogo, o launcher SHALL aceitar conexões TCP em `127.0.0.1:8281` e
encaminhá-las para o endereço e porta do servidor de jogo configurados,
reproduzindo o efeito da regra `netsh interface portproxy` documentada em
`/download`.

O launcher NÃO SHALL exigir privilégio de administrador para isso, e NÃO SHALL
criar nenhuma configuração persistente de rede no sistema operacional.

O launcher SHALL escutar exclusivamente em `127.0.0.1`, nunca em todas as
interfaces, para não expor o encaminhamento à rede local.

#### Scenario: Encaminhamento estabelecido

- **WHEN** o jogador clica em jogar e a porta `8281` está livre
- **THEN** o launcher passa a aceitar conexões em `127.0.0.1:8281`
- **AND** cada conexão recebida é encaminhada ao servidor de jogo configurado
- **AND** nenhum prompt de controle de conta de usuário é exibido

#### Scenario: Servidor de jogo inacessível

- **WHEN** o encaminhamento não consegue estabelecer conexão com o servidor
- **THEN** o launcher informa que o servidor está indisponível
- **AND** não executa o jogo

#### Scenario: Múltiplas conexões simultâneas

- **WHEN** mais de uma conexão chega em `127.0.0.1:8281`
- **THEN** cada uma é encaminhada de forma independente

#### Scenario: Nenhum resíduo após o encerramento

- **WHEN** o launcher é encerrado
- **THEN** nenhuma regra de rede, serviço ou configuração persistente criada por
  ele permanece no sistema

### Requirement: Porta 8281 já ocupada

Quando a porta `8281` já estiver em uso, o launcher SHALL identificar o conflito
ao jogador em vez de falhar de forma genérica, porque a causa mais provável é uma
regra `netsh portproxy` criada manualmente seguindo as instruções atuais do site.

Como remover essa regra exige privilégio de administrador, a mensagem SHALL
incluir o comando de remoção necessário.

#### Scenario: Porta ocupada por regra portproxy anterior

- **WHEN** o jogador clica em jogar e a porta `8281` está ocupada
- **THEN** o launcher explica que a porta está em uso, provavelmente por uma
  regra de portproxy criada manualmente
- **AND** exibe o comando de remoção a ser executado como administrador
- **AND** permite tentar novamente sem reiniciar o launcher

### Requirement: Execução do jogo

Após estabelecer o encaminhamento, o launcher SHALL executar `wyd.exe` a partir
da pasta do jogo, com o diretório de trabalho apontando para essa pasta.

#### Scenario: Jogo inicia

- **WHEN** o encaminhamento está ativo e `wyd.exe` existe
- **THEN** o launcher executa `wyd.exe` com o diretório de trabalho na pasta do
  jogo

#### Scenario: Executável ausente no momento do clique

- **WHEN** o jogador clica em jogar e `wyd.exe` não está mais na pasta
- **THEN** o launcher informa que o client não foi encontrado e oferece instalar
  novamente
- **AND** não deixa o encaminhamento ativo

#### Scenario: Jogo falha ao abrir

- **WHEN** a execução de `wyd.exe` falha
- **THEN** o launcher informa o erro
- **AND** encerra o encaminhamento

### Requirement: Ciclo de vida durante a partida

O launcher SHALL manter o encaminhamento ativo enquanto o jogo estiver em
execução e SHALL encerrá-lo quando o jogo terminar.

Como fechar o launcher derruba a conexão do jogo, ele SHALL avisar o jogador
antes de fechar enquanto o jogo estiver rodando, e SHALL respeitar a decisão do
jogador.

#### Scenario: Jogo é encerrado pelo jogador

- **WHEN** o processo do jogo termina
- **THEN** o launcher encerra o encaminhamento
- **AND** volta ao estado em que o botão de jogar está disponível novamente

#### Scenario: Jogador tenta fechar o launcher com o jogo aberto

- **WHEN** o jogador fecha a janela do launcher enquanto o jogo está em execução
- **THEN** o launcher avisa que o jogo perderá a conexão
- **AND** só fecha se o jogador confirmar

#### Scenario: Jogador cancela o fechamento

- **WHEN** o jogador cancela o aviso de fechamento
- **THEN** o launcher continua aberto e o encaminhamento permanece ativo

### Requirement: Endereço do servidor configurado no build

O endereço e a porta do servidor de jogo SHALL vir da configuração da aplicação,
não de entrada do jogador, de modo que uma mudança de endereço do servidor seja
resolvida por uma nova versão do launcher e não por instruções manuais.

#### Scenario: Jogador não pode alterar o destino

- **WHEN** o jogador navega pela interface do launcher
- **THEN** não existe campo que permita alterar o endereço ou a porta do servidor
  de jogo
