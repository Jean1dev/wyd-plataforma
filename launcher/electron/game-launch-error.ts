export function gameLaunchErrorMessage(error: NodeJS.ErrnoException): string {
  if (error.code === "EACCES" || error.code === "EPERM") {
    return 'O Windows não permitiu abrir o jogo. Feche o launcher, clique com o botão direito no atalho e escolha "Executar como administrador". Depois, clique em "Jogar" novamente.';
  }

  if (error.code === "ENOENT") {
    return "Não encontramos o executável do jogo. Confira a pasta selecionada ou instale o client novamente.";
  }

  return "Não foi possível abrir o jogo. Tente novamente. Se o problema continuar, entre em contato com o suporte.";
}
