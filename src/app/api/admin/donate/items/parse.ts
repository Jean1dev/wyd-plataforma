import type { DonateShopItem } from "@/lib/donate/types";
import { parsePositiveInt32 } from "@/lib/npc/validation";
import { bool, int, text } from "@/lib/web-api/body-parse";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseDonateShopItemBody(raw: unknown, id = "0"): Parsed<DonateShopItem> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "body_invalid" };
  const body = raw as Record<string, unknown>;
  const itemIndex = parsePositiveInt32(body.item_index);
  if (itemIndex == null) return { ok: false, error: "item_index_invalid" };

  const item: DonateShopItem = {
    id,
    item_index: itemIndex,
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

  if (item.price <= 0) return { ok: false, error: "price_invalid" };
  if (item.expires_days < 0) return { ok: false, error: "expires_days_invalid" };
  if (!item.title) return { ok: false, error: "title_required" };

  return { ok: true, value: item };
}
