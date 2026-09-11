## 1. Verificações prévias em máquina Windows

- [ ] 1.1 Confirmar numa máquina ou VM Windows com o client real que `wyd.exe` é o executável de entrada do jogo — verificar executando-o diretamente com a regra `netsh portproxy` ativa e chegando à tela de login
- [ ] 1.2 Confirmar que `8281` é a única porta que o client abre — verificar com `netstat -ano` filtrando o PID do `wyd.exe` durante uma sessão até o login; se aparecerem outras portas, atualizar a spec `launcher/game-launch` antes de seguir
- [ ] 1.3 Provisionar o bucket no Railway Object Storage, subir o zip do client e verificar que a URL responde `200` com o arquivo íntegro para uma requisição anônima

## 2. Isolamento do subprojeto na raiz do repositório

- [x] 2.1 Adicionar `launcher` ao `exclude` do `tsconfig.json` e verificar que `pnpm typecheck` e `pnpm build` do portal continuam passando com arquivos TypeScript presentes em `launcher/`
- [x] 2.2 Adicionar `launcher/**` aos `globalIgnores` do `eslint.config.mjs` e verificar que `pnpm lint` não reporta nada de `launcher/`
- [x] 2.3 Adicionar `launcher/node_modules`, `launcher/dist` e `launcher/dist_electron` ao `.gitignore` e verificar com `git status` que nenhum deles aparece após instalar dependências e buildar o launcher

## 3. Esqueleto do projeto Electron

- [x] 3.1 Criar `launcher/` como projeto npm independente com Electron, Vite, React e TypeScript, espelhando a estrutura de `crypto-easy-connect`, e verificar que `pnpm install` na raiz do repositório continua não instalando as dependências do launcher
- [x] 3.2 Criar a janela principal com `contextIsolation: true`, `nodeIntegration: false` e preload expondo a API por `contextBridge`, e verificar que a janela abre em modo de desenvolvimento carregando o servidor Vite
- [x] 3.3 Criar `launcher/electron-builder.json` com `appId`, `productName`, alvo NSIS com `oneClick: false`, `asarUnpack` dos arquivos do processo main e `publish` com provider `github`, e verificar que `electron-builder` valida a configuração sem erro
- [x] 3.4 Definir o módulo de configuração da aplicação com endereço e porta do servidor de jogo e a URL do pacote do client, e verificar que o renderer não tem acesso a nenhum desses valores por caminho que não seja a API do preload

## 4. Configuração persistente e pasta do jogo

- [x] 4.1 Implementar leitura e escrita da configuração em JSON dentro de `app.getPath('userData')` e verificar que a pasta escolhida sobrevive a fechar e reabrir o launcher
- [x] 4.2 Implementar a tela de primeira execução com seletor de pasta e sugestão padrão fora de `Program Files`, e verificar que o botão de jogar fica indisponível enquanto não houver pasta definida
- [x] 4.3 Implementar a troca de pasta pelas configurações e verificar que a presença do client é reavaliada na nova pasta
- [x] 4.4 Tratar pasta persistida inexistente ou inacessível e verificar que o launcher oferece instalar novamente ou escolher outra pasta em vez de falhar

## 5. Detecção e instalação do client

- [x] 5.1 Implementar a detecção de client instalado por presença de `wyd.exe` na raiz da pasta do jogo e verificar os dois estados manualmente, criando e removendo o arquivo
- [x] 5.2 Implementar o download do pacote para arquivo temporário com progresso reportado ao renderer, e verificar que o percentual avança e a janela continua respondendo durante todo o download
- [x] 5.3 Implementar a extração do zip para diretório temporário dentro da pasta do jogo, com indicação de progresso, e verificar que a janela continua respondendo em pacote de tamanho real
- [x] 5.4 Implementar o passo final de mover o conteúdo extraído para a pasta do jogo e verificar que `wyd.exe` só passa a existir depois que a extração terminou por completo
- [x] 5.5 Implementar a limpeza de temporários em todos os caminhos de falha e verificar, interrompendo a rede no meio do download e matando o processo durante a extração, que `wyd.exe` não existe e nenhum resíduo permanece
- [x] 5.6 Tratar falta de espaço em disco com mensagem específica e verificar num volume artificialmente pequeno que a instalação falha explicitamente e limpa os temporários

## 6. Proxy TCP local

- [x] 6.1 Implementar o servidor TCP escutando exclusivamente em `127.0.0.1:8281` e encaminhando cada conexão ao servidor de jogo configurado, e verificar com `telnet 127.0.0.1 8281` que a conexão é estabelecida ponta a ponta
- [ ] 6.2 Verificar que o encaminhamento não escuta em outras interfaces, tentando conectar em `8281` a partir de outra máquina da rede local e obtendo recusa
- [x] 6.3 Tratar múltiplas conexões simultâneas de forma independente e verificar abrindo duas conexões ao mesmo tempo que ambas trafegam
- [x] 6.4 Tratar servidor de jogo inacessível e verificar, com endereço de destino inválido, que o launcher informa indisponibilidade e não executa o jogo
- [x] 6.5 Tratar `EADDRINUSE` com mensagem específica sobre regra de portproxy, incluindo o comando de remoção, e verificar criando a regra `netsh` manualmente antes de clicar em jogar
- [ ] 6.6 Verificar que o encerramento do launcher não deixa nenhuma regra de rede ou porta em escuta, conferindo `netsh interface portproxy show all` e `netstat -ano` depois de fechar

## 7. Execução do jogo e ciclo de vida

- [x] 7.1 Implementar a execução de `wyd.exe` com diretório de trabalho na pasta do jogo e verificar que o jogo abre e chega à tela de login pelo botão de jogar, sem nenhum prompt de controle de conta de usuário
- [x] 7.2 Tratar `wyd.exe` ausente no momento do clique e verificar, apagando o arquivo com o launcher aberto, que a mensagem aparece e o encaminhamento não fica ativo
- [x] 7.3 Tratar falha ao executar o jogo e verificar que o encaminhamento é encerrado junto
- [x] 7.4 Encerrar o encaminhamento quando o processo do jogo terminar e verificar que a porta `8281` deixa de estar em escuta e o botão de jogar volta a ficar disponível
- [x] 7.5 Implementar o aviso de confirmação ao fechar a janela com o jogo em execução e verificar os dois caminhos: cancelar mantém tudo ativo, confirmar fecha o launcher
- [x] 7.6 Verificar que a interface não oferece nenhum campo para alterar o endereço ou a porta do servidor de jogo

## 8. Atualização automática do launcher

- [x] 8.1 Integrar o `electron-updater` com verificação automática no início, sem download automático, e verificar que a verificação é ignorada em execução de desenvolvimento
- [x] 8.2 Expor os eventos de verificação, progresso, conclusão e erro ao renderer pela API do preload e verificar que cada um chega com a versão correspondente
- [x] 8.3 Implementar a interface de atualização com download acionado pelo jogador e instalação sob segunda confirmação, e verificar que o launcher continua utilizável durante o download
- [x] 8.4 Verificar que a falha na verificação de atualização não bloqueia instalar o client nem jogar, simulando o serviço de atualização inacessível
- [x] 8.5 Verificar que uma atualização baixada não reinicia o launcher por conta própria com o jogo aberto, e que pedir para instalar nesse estado avisa que o jogo perderá a conexão

## 9. Pipeline de release

- [x] 9.1 Criar `.github/workflows/launcher-release.yml` disparado por tag, rodando em `windows-latest`, buildando o launcher e publicando com `electron-builder --publish always`, e verificar que uma tag de teste produz a release com o instalador, o `latest.yml` e o `.blockmap`
- [x] 9.2 Verificar que o workflow não é disparado por commits do portal e não interfere em nenhum comando existente da raiz
- [x] 9.3 Documentar no `README.md` do `launcher/` que GitHub Releases deste repositório pertencem exclusivamente ao launcher e por quê

## 10. Validação de ponta a ponta em Windows

- [ ] 10.1 Instalar o launcher a partir do instalador publicado numa máquina Windows limpa, sem client instalado, e verificar o fluxo completo até a tela de login do jogo, sem nenhum prompt de controle de conta de usuário
- [ ] 10.2 Reabrir o launcher e verificar que ele reconhece a pasta e o client já instalados e vai direto ao botão de jogar
- [ ] 10.3 Publicar uma versão seguinte e verificar na mesma máquina que o launcher instalado detecta, baixa e instala a atualização, reabrindo na nova versão
- [ ] 10.4 Verificar o caminho de conflito real: criar a regra `netsh portproxy` das instruções atuais do site, clicar em jogar e confirmar que a mensagem de porta ocupada aparece com o comando de remoção
