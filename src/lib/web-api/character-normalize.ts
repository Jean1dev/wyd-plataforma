export type CharacterSummaryRaw = {
  slot: number;
  name: string;
  class: Buffer;
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

type DecodedCharacterBlob = {
  name?: string;
  level?: number;
  classId?: number;
  exp?: string;
  coin?: string;
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  strength?: number;
  intelligence?: number;
  dexterity?: number;
  constitution?: number;
};

const TAG_TO_FIELD: Record<number, keyof Pick<DecodedCharacterBlob, "coin" | "hp" | "maxHp" | "mp" | "maxMp" | "strength" | "intelligence" | "dexterity" | "constitution">> = {
  0x30: "coin",
  0x38: "hp",
  0x40: "maxHp",
  0x48: "mp",
  0x50: "maxMp",
  0x58: "strength",
  0x60: "intelligence",
  0x68: "dexterity",
  0x70: "constitution",
};

function readVarint(buf: Buffer, start: number): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let pos = start;

  while (pos < buf.length) {
    const byte = buf[pos++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  return { value, next: pos };
}

function asciiRuns(buf: Buffer): Array<{ start: number; end: number; text: string }> {
  const runs: Array<{ start: number; end: number; text: string }> = [];
  let start = -1;

  for (let i = 0; i <= buf.length; i++) {
    const b = buf[i];
    const printable = i < buf.length && b >= 32 && b <= 126;

    if (printable && start === -1) {
      start = i;
    }

    if ((!printable || i === buf.length) && start !== -1) {
      if (i - start >= 3) {
        runs.push({ start, end: i, text: buf.subarray(start, i).toString("utf8") });
      }
      start = -1;
    }
  }

  return runs;
}

function decodeCharacterBlob(blob: Buffer): DecodedCharacterBlob {
  const out: DecodedCharacterBlob = {};
  const runs = asciiRuns(blob);
  const nameRun = runs[runs.length - 1];

  if (nameRun) {
    out.name = nameRun.text;

    if (nameRun.start >= 4 && blob[nameRun.start - 4] === 0x08 && blob[nameRun.start - 2] === 0x12) {
      const level = blob[nameRun.start - 3];
      if (level != null) out.level = level;
    }

    if (nameRun.end + 1 < blob.length && blob[nameRun.end] === 0x18) {
      const classId = blob[nameRun.end + 1];
      if (classId != null) out.classId = classId;
    }
  }

  const first = readVarint(blob, 0);
  out.exp = String(first.value);
  let pos = first.next;

  while (pos < blob.length) {
    const tag = blob[pos];
    const key = TAG_TO_FIELD[tag];
    if (!key) break;
    pos += 1;
    const { value, next } = readVarint(blob, pos);
    pos = next;

    if (key === "coin") {
      out[key] = String(value);
    } else {
      out[key] = value;
    }
  }

  return out;
}

export function normalizeCharacterSummary(raw: CharacterSummaryRaw): CharacterSummaryView {
  const decoded = decodeCharacterBlob(raw.class);
  const classLabel = decoded.classId != null ? `Classe ${decoded.classId}` : "Desconhecida";

  return {
    slot: raw.slot,
    name: decoded.name ?? raw.name,
    classLabel,
    level: decoded.level ?? raw.level,
    exp: decoded.exp ?? raw.exp,
    coin: decoded.coin ?? raw.coin,
    hp: decoded.hp ?? raw.hp,
    maxHp: decoded.maxHp ?? raw.max_hp,
    mp: decoded.mp ?? raw.mp,
    maxMp: decoded.maxMp ?? raw.max_mp,
    strength: decoded.strength ?? raw.strength,
    intelligence: decoded.intelligence ?? raw.intelligence,
    dexterity: decoded.dexterity ?? raw.dexterity,
    constitution: decoded.constitution ?? raw.constitution,
  };
}
