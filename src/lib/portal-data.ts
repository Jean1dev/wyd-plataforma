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

export type Client = {
  os: string;
  sub: string;
  icon: string;
  tag: string;
  btnVariant: "primary" | "steel" | "ghost";
  btnLabel: string;
};

export const CLIENTS: Client[] = [
  { os: "Cliente Completo", sub: "Windows · 4.2 GB", icon: "⊞", tag: "Recomendado", btnVariant: "primary", btnLabel: "Baixar para Windows" },
  { os: "Launcher Leve", sub: "Windows · 80 MB", icon: "⬇", tag: "", btnVariant: "steel", btnLabel: "Baixar Launcher" },
  { os: "Patch Manual", sub: "Atualização · 320 MB", icon: "⟳", tag: "", btnVariant: "ghost", btnLabel: "Baixar Patch" },
];

export const STEPS = [
  { n: 1, title: "Crie sua conta", desc: "Cadastre-se no portal em menos de um minuto." },
  { n: 2, title: "Baixe o cliente", desc: "Escolha o cliente completo ou o launcher leve." },
  { n: 3, title: "Instale e atualize", desc: "Rode o launcher e aplique o patch mais recente." },
  { n: 4, title: "Entre no reino", desc: "Crie seu personagem e comece sua jornada em Kersef." },
];

export const REQ_MIN = ["Windows 7 64-bit", "Core i3 / equivalente", "4 GB de RAM", "DirectX 9.0c", "5 GB livres"];
export const REQ_REC = ["Windows 10/11 64-bit", "Core i5 / Ryzen 5", "8 GB de RAM", "DirectX 11", "SSD · 10 GB livres"];
