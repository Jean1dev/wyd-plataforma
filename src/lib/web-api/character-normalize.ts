import { CLASS_META, wydClassFromCode, type WydClass } from "@/lib/wyd-class";

export type CharacterSummaryRaw = {
  slot: number;
  name: string;
  class: number;
  level: number;
  exp: string;
  coin: number;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  str: number;
  int: number;
  dex: number;
  con: number;
};

export type CharacterSummaryView = {
  slot: number;
  name: string;
  cls?: WydClass;
  classLabel: string;
  level: number;
  exp: string;
  coin: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  constitution: number;
};

export function normalizeCharacterSummary(raw: CharacterSummaryRaw): CharacterSummaryView {
  const cls = wydClassFromCode(raw.class);

  return {
    slot: raw.slot,
    name: raw.name,
    cls,
    classLabel: cls ? CLASS_META[cls].label : `Classe ${raw.class}`,
    level: raw.level,
    exp: raw.exp,
    coin: String(raw.coin ?? 0),
    hp: raw.hp,
    maxHp: raw.max_hp,
    mp: raw.mp,
    maxMp: raw.max_mp,
    strength: raw.str,
    intelligence: raw.int,
    dexterity: raw.dex,
    constitution: raw.con,
  };
}
