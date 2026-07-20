import { NextResponse } from "next/server";
import type { DropItemEntry, MobDropEntry } from "@/lib/npc/types";

const INT32_MAX = 2147483647;

type Parsed<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

export function textParam(params: URLSearchParams, name: string): string {
  return (params.get(name) ?? "").trim();
}

export function parseItemIndex(params: URLSearchParams): Parsed<number> {
  const raw = params.get("itemIndex");
  if (raw == null || raw.trim() === "") return { ok: true, value: 0 };

  const value = raw.trim();
  if (!/^\d+$/.test(value)) {
    return { ok: false, response: NextResponse.json({ error: "item_index_invalid" }, { status: 422 }) };
  }

  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > INT32_MAX) {
    return { ok: false, response: NextResponse.json({ error: "item_index_invalid" }, { status: 422 }) };
  }

  return { ok: true, value: n };
}

export function parseIncludeZero(params: URLSearchParams): Parsed<boolean> {
  const raw = params.get("includeZero");
  if (raw == null || raw.trim() === "") return { ok: true, value: false };

  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1") return { ok: true, value: true };
  if (value === "false" || value === "0") return { ok: true, value: false };

  return { ok: false, response: NextResponse.json({ error: "include_zero_invalid" }, { status: 422 }) };
}

export function httpDropItem(entry: DropItemEntry) {
  return {
    itemIndex: entry.item_index,
    itemName: entry.item_name,
    mobs: (entry.mobs ?? []).map((mob) => ({
      templateName: mob.template_name,
      mobName: mob.mob_name,
      mobLevel: mob.mob_level,
      slot: mob.slot,
      rateDivisor: mob.rate_divisor,
    })),
  };
}

export function httpMobDrop(entry: MobDropEntry) {
  return {
    templateName: entry.template_name,
    mobName: entry.mob_name,
    mobLevel: entry.mob_level,
    items: (entry.items ?? []).map((item) => ({
      slot: item.slot,
      itemIndex: item.item_index,
      itemName: item.item_name,
      rateDivisor: item.rate_divisor,
    })),
  };
}
