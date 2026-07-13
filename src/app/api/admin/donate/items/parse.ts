import type { DonateShopItem } from "@/lib/donate/types";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function int(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

export function parseDonateShopItemBody(raw: unknown, id = "0"): Parsed<DonateShopItem> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "body_invalid" };
  const body = raw as Record<string, unknown>;

  const item: DonateShopItem = {
    id,
    item_index: int(body.item_index),
    eff1: int(body.eff1),
    effv1: int(body.effv1),
    eff2: int(body.eff2),
    effv2: int(body.effv2),
    eff3: int(body.eff3),
    effv3: int(body.effv3),
    price: int(body.price),
    title: text(body.title),
    description: text(body.description),
    enabled: bool(body.enabled),
    expires_days: int(body.expires_days),
  };

  if (item.item_index <= 0) return { ok: false, error: "item_index_invalid" };
  if (item.price <= 0) return { ok: false, error: "price_invalid" };
  if (item.expires_days < 0) return { ok: false, error: "expires_days_invalid" };
  if (!item.title) return { ok: false, error: "title_required" };

  return { ok: true, value: item };
}
