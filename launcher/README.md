# WYD Kersef Launcher

Este diretório é um projeto npm independente. O portal na raiz não instala nem compila suas dependências.

O launcher é distribuído exclusivamente por GitHub Releases deste repositório. Isso é necessário porque o `electron-updater` consulta sempre a release mais recente; publicar releases de outro componente quebraria a atualização automática dos launchers instalados.

Em desenvolvimento, use `pnpm install` e `pnpm dev` dentro desta pasta. O destino do servidor e a URL do pacote do client são configuração da aplicação e não aparecem como campos editáveis na interface.

Na plataforma, injete as variáveis do bucket Railway (`AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` e `AWS_DEFAULT_REGION`). Defina `WYD_CLIENT_DOWNLOAD_URL` ao empacotar uma release para apontar para o endpoint público `/api/launcher/client` da plataforma. A plataforma mantém o bucket privado e faz o proxy autenticado do arquivo para o launcher.
