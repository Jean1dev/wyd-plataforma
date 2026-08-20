import type { WydClass } from "@/components/ui";

/** Server presentation config (props in the original prototype). */
export const SERVER_NAME = "Kersef — Hard";
export const EXP_RATE = "x50";
export const COIN_BALANCE = "12.500";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/rankings", label: "Rankings" },
  { href: "/download", label: "Download" },
  { href: "/loja", label: "Loja" },
  { href: "/recompensas", label: "Recompensas" },
  { href: "/comunidade", label: "Comunidade" },
] as const;

export type Character = {
  name: string;
  cls: WydClass;
  level: number;
  hp0: number;
  hp1: number;
  mp0: number;
  mp1: number;
  exp: number;
};

export const CHARS: Character[] = [
  { name: "Valdric", cls: "TK", level: 400, hp0: 3800, hp1: 4000, mp0: 1200, mp1: 2600, exp: 62 },
  { name: "Morwyn", cls: "FM", level: 387, hp0: 1600, hp1: 2100, mp0: 3900, mp1: 4200, exp: 18 },
  { name: "Sylvana", cls: "HT", level: 355, hp0: 2400, hp1: 2800, mp0: 1800, mp1: 2400, exp: 91 },
];

export type LadderEntry = {
  name: string;
  cls: WydClass;
  level: number;
  score: string;
  guild: string;
};

export const LADDER: LadderEntry[] = [
  { name: "Valdric", cls: "TK", level: 400, score: "98.4k", guild: "Dragões de Kersef" },
  { name: "Sylvana", cls: "HT", level: 400, score: "91.0k", guild: "Lâminas Negras" },
  { name: "Morwyn", cls: "FM", level: 399, score: "88.7k", guild: "Círculo Arcano" },
  { name: "Thrain", cls: "BM", level: 398, score: "84.2k", guild: "Uivo da Montanha" },
  { name: "Kaelith", cls: "TK", level: 397, score: "80.9k", guild: "Dragões de Kersef" },
  { name: "Vesper", cls: "HT", level: 395, score: "77.1k", guild: "Lâminas Negras" },
  { name: "Oryn", cls: "FM", level: 392, score: "73.6k", guild: "" },
  { name: "Brokk", cls: "BM", level: 390, score: "69.0k", guild: "Uivo da Montanha" },
];

export const RANK_TABS: { id: WydClass | "ALL"; label: string }[] = [
  { id: "ALL", label: "Todos" },
  { id: "TK", label: "Transknight" },
  { id: "FM", label: "Foema" },
  { id: "BM", label: "BeastMaster" },
  { id: "HT", label: "Huntress" },
];

export type Pack = {
  coins: string;
  price: string;
  bonus: string;
  tag: string;
  tagVariant: "gold" | "premium";
};

export const PACKS: Pack[] = [
  { coins: "1.500", price: "R$ 25,00", bonus: "", tag: "", tagVariant: "gold" },
  { coins: "3.200", price: "R$ 50,00", bonus: "+200 bônus", tag: "Popular", tagVariant: "gold" },
  { coins: "7.000", price: "R$ 100,00", bonus: "+800 bônus", tag: "Melhor valor", tagVariant: "gold" },
  { coins: "15.000", price: "R$ 200,00", bonus: "+2.500 bônus", tag: "Lendário", tagVariant: "premium" },
];

export type ShopItem = { name: string; cost: string; icon: string };

export const ITEMS: ShopItem[] = [
  { name: "Set Celestial +11", cost: "9.500", icon: "⚔" },
  { name: "Montaria Dragão Sombrio", cost: "6.200", icon: "✸" },
  { name: "Pacote de Refino x10", cost: "2.400", icon: "❖" },
  { name: "Pergaminho de Teleporte x50", cost: "900", icon: "✦" },
];

export const NEWS = [
  { date: "28 jun", title: "Evento de Guerra de Torres neste sábado" },
  { date: "24 jun", title: "Novo set Celestial chega à Loja" },
  { date: "20 jun", title: "Correção de balanceamento das classes" },
];

export const CLIENT_DOWNLOAD_URL = "https://transfer.it/t/aWLiD0sHgbIL";

export const ACCESS_COMMAND =
  "netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=8281 connectaddress=66.33.22.224 connectport=56950";

export const REMOVE_ACCESS_COMMAND =
  "netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=8281";

export const STEPS = [
  { n: 1, title: "Baixe o client", desc: "Use o link temporário disponível nesta página." },
  { n: 2, title: "Abra o terminal", desc: "No Windows, abra o Terminal ou PowerShell como administrador." },
  { n: 3, title: "Rode o comando de acesso", desc: "Execute o comando de portproxy antes de entrar no jogo." },
  { n: 4, title: "Remova quando terminar", desc: "Depois de jogar, rode o comando de remoção se quiser desfazer o ajuste." },
];

export const REQ_MIN = ["Windows 7 64-bit", "Core i3 / equivalente", "4 GB de RAM", "DirectX 9.0c", "5 GB livres"];
export const REQ_REC = ["Windows 10/11 64-bit", "Core i5 / Ryzen 5", "8 GB de RAM", "DirectX 11", "SSD · 10 GB livres"];

export const DISCORD_INVITE_URL = "https://discord.gg/msCswzyqg";

export const COMMUNITY_HIGHLIGHTS = [
  {
    icon: "✦",
    title: "Avisos em primeira mão",
    desc: "Manutenções, quedas e volta do servidor são anunciadas lá antes de qualquer outro lugar.",
  },
  {
    icon: "⚔",
    title: "Eventos e guerras",
    desc: "Horário de guerra, eventos e mudanças de rate saem no canal de anúncios.",
  },
  {
    icon: "❖",
    title: "Suporte direto",
    desc: "Problema de conta, item sumido ou dúvida de donate — fale com a equipe sem sair do Discord.",
  },
  {
    icon: "✸",
    title: "Papo com a comunidade",
    desc: "Monte party, procure guild e troque build com quem já joga no servidor.",
  },
];

export const COMMUNITY_SUPPORT = [
  {
    n: 1,
    title: "Preciso de ajuda",
    desc: "Use o canal de suporte e descreva o que aconteceu. Evite mandar DM para a equipe — no canal qualquer moderador online consegue te atender.",
  },
  {
    n: 2,
    title: "Quero reportar um bug",
    desc: "Poste no canal de bugs com o nick do personagem, data e horário aproximados, e um print ou vídeo do que aconteceu.",
  },
  {
    n: 3,
    title: "Falar com a moderação",
    desc: "Denúncias de jogador, recursos de punição e assuntos de conta vão no canal da moderação, que é privado entre você e a equipe.",
  },
];
