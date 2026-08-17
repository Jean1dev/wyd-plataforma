// PT-BR labels for the equip slots the catalog reports in `slots` (already
// decoded from the nPos bitmask server-side — see docs/item-icons.md §slot_mask).
// Bit i of slot_mask is Equip[i], so the array index doubles as that bit.

export const SLOT_ORDER = [
  "face",
  "helmet",
  "armor",
  "pants",
  "gloves",
  "boots",
  "weapon",
  "shield",
  "accessory",
  "amulet",
  "orb",
  "gem",
  "medal",
  "fairy",
  "mount",
  "cape",
] as const;

const SLOT_LABELS: Record<string, string> = {
  face: "rosto",
  helmet: "elmo",
  armor: "armadura",
  pants: "calça",
  gloves: "luvas",
  boots: "botas",
  weapon: "arma",
  shield: "escudo",
  accessory: "acessório",
  amulet: "amuleto",
  orb: "orbe",
  gem: "gema",
  medal: "medalha",
  fairy: "fada",
  mount: "montaria",
  cape: "manto",
};

/** "weapon"+"shield" → "arma + escudo". Unknown names pass through as-is. */
export function slotsLabel(slots: string[]): string {
  return slots.map((s) => SLOT_LABELS[s] ?? s).join(" + ");
}
