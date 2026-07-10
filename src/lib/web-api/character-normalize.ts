export type CharacterSummaryRaw = {
  slot: number;
  name: string;
  class: number;
  level: number;
  exp: string;
  coin: string;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  constitution: number;
};

export type CharacterSummaryView = {
  slot: number;
  name: string;
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
  return {
    slot: raw.slot,
    name: raw.name,
    classLabel: `Classe ${raw.class}`,
    level: raw.level,
    exp: raw.exp,
    coin: raw.coin,
    hp: raw.hp,
    maxHp: raw.max_hp,
    mp: raw.mp,
    maxMp: raw.max_mp,
    strength: raw.strength,
    intelligence: raw.intelligence,
    dexterity: raw.dexterity,
    constitution: raw.constitution,
  };
}
