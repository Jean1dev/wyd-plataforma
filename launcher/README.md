# WYD Kersef Launcher

Este diretório é um projeto npm independente. O portal na raiz não instala nem compila suas dependências.

O launcher é distribuído exclusivamente por GitHub Releases deste repositório. Isso é necessário porque o `electron-updater` consulta sempre a release mais recente; publicar releases de outro componente quebraria a atualização automática dos launchers instalados.

Em desenvolvimento, use `pnpm install` e `pnpm dev` dentro desta pasta. O destino do servidor e a URL do pacote do client são configuração da aplicação e não aparecem como campos editáveis na interface.

## Publicação

Atualize a versão em `package.json` e `package-lock.json`, faça o commit e publique uma tag `vX.Y.Z` correspondente. O workflow empacota sem publicar pelo electron-builder, envia os arquivos para uma única release e só a torna pública depois de verificar o instalador `.exe`, o `.exe.blockmap` e o `latest.yml`.

Para instalar no Windows x64, baixe `WYD-Kersef-Launcher-Setup-X.Y.Z.exe`. O arquivo `.exe.blockmap` é auxiliar da atualização automática e não deve ser executado.

Na plataforma, injete as variáveis do bucket Railway (`AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` e `AWS_DEFAULT_REGION`). A região deve ser `auto`, sem espaços ou caracteres invisíveis. O client permanece no bucket privado, na chave `launcher/client/latest.zip`; o endpoint público `/api/launcher/client` transmite o ZIP usando as credenciais do servidor.

O launcher empacotado usa `https://wyd-ten.vercel.app/api/launcher/client`, sem depender de variáveis no computador do jogador. `WYD_CLIENT_DOWNLOAD_URL` permite substituir esse endereço somente em desenvolvimento (HTTPS). A verificação do pacote confirma que o endereço de produção está incluído.

A página pública `/download` oferece o instalador pelo endpoint `/api/launcher/download`, que consulta a última release estável do GitHub com cache de cinco minutos. `NEXT_PUBLIC_CLIENT_DOWNLOAD_URL` não é mais usado pelo site. Valide o download do ZIP antes de publicar uma nova release do launcher.
