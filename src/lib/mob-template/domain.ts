// Domain semantics for mob template stat editing, mirrored on the client for
// UX. The web-api remains the authority on validation — never trust these for
// security.

import type { AdminMobTemplateStat } from "./types";

// Equip[16] on the mob template (MAX_EQUIP).
export const EQUIP_SLOT_COUNT = 16;

export const DIRECTION_MIN = 0;
export const DIRECTION_MAX = 7;

// int64 on the wire, string end to end (see channel.ts's `longs: String`).
// Accepts a numeric string/number, defaults to "0" on anything else. Shared
// by the BFF route (server) and StatForm (client) so both agree on one rule.
export function sanitizeExpString(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return v.trim();
  return "0";
}

// A real monster is one that isn't a merchant/quest NPC and has a level.
export function isRealMonster(s: Pick<AdminMobTemplateStat, "level" | "merchant">): boolean {
  return s.level >= 1 && s.merchant === 0;
}

// EXP outside this range on a real monster is a sign of a mis-calibrated
// template (see backend cmd/exptool). Client-side warning only — never a
// hard block.
export const EXP_SANITY_MAX = 10_000_000;

export function expWarning(s: Pick<AdminMobTemplateStat, "level" | "merchant" | "exp">): string | null {
  if (!isRealMonster(s)) return null;
  const exp = Number(s.exp);
  if (!Number.isFinite(exp)) return null;
  if (exp === 0) return "EXP está zerada para um monstro real (level ≥ 1, merchant = 0).";
  if (exp > EXP_SANITY_MAX) {
    return `EXP muito alta (> ${EXP_SANITY_MAX.toLocaleString("pt-BR")}) para um monstro real.`;
  }
  return null;
}
