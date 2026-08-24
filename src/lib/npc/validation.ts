import type { AdminNpcShopItem } from "./types";

export const POSITIVE_INT32_MAX = 2147483647;
export const UINT8_MAX = 255;

export function parsePositiveInt32(value: unknown): number | null {
  const parsed = integer(value);
  return parsed != null && parsed >= 1 && parsed <= POSITIVE_INT32_MAX ? parsed : null;
}

export function parseUint8(value: unknown): number | null {
  const parsed = integer(value);
  return parsed != null && parsed >= 0 && parsed <= UINT8_MAX ? parsed : null;
}

export function normalizeShopQuantity(value: unknown): number | null {
  if (value == null || value === "") return 1;
  const parsed = integer(value);
  if (parsed === 0) return 1;
  return parsed != null && parsed >= 1 && parsed <= UINT8_MAX ? parsed : null;
}

const INT64_MIN = BigInt("-9223372036854775808");
const INT64_MAX = BigInt("9223372036854775807");

export function parseInt64Decimal(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) return null;
    value = String(value);
  }
  if (typeof value !== "string" || !/^-?\d+$/.test(value.trim())) return null;

  try {
    const parsed = BigInt(value.trim());
    if (parsed < INT64_MIN || parsed > INT64_MAX) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

type ShopParseResult =
  | { ok: true; items: AdminNpcShopItem[] }
  | { ok: false; error: string };

export function parseNpcShopItems(raw: unknown, slotCount: number): ShopParseResult {
  if (!Array.isArray(raw)) return { ok: false, error: "items_required" };

  const seen = new Set<number>();
  const items: AdminNpcShopItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "item_invalid" };
    const value = entry as Record<string, unknown>;
    const slot = integer(value.slot);
    const itemIndex = parsePositiveInt32(value.item_index);
    const quantity = normalizeShopQuantity(value.quantity);
    const effects = {
      eff1: parseUint8(value.eff1 ?? 0),
      effv1: parseUint8(value.effv1 ?? 0),
      eff2: parseUint8(value.eff2 ?? 0),
      effv2: parseUint8(value.effv2 ?? 0),
      eff3: parseUint8(value.eff3 ?? 0),
      effv3: parseUint8(value.effv3 ?? 0),
    };

    if (slot == null || slot < 0 || slot >= slotCount) return { ok: false, error: "slot_out_of_range" };
    if (seen.has(slot)) return { ok: false, error: "slot_duplicated" };
    if (itemIndex == null) return { ok: false, error: "item_index_invalid" };
    if (quantity == null) return { ok: false, error: "quantity_invalid" };
    if (Object.values(effects).some((effect) => effect == null)) {
      return { ok: false, error: "effect_invalid" };
    }
    if (effects.eff1 === 61 || effects.eff2 === 61 || effects.eff3 === 61) {
      return { ok: false, error: "effect_amount_derived" };
    }

    seen.add(slot);
    items.push({
      slot,
      item_index: itemIndex,
      eff1: effects.eff1!,
      effv1: effects.effv1!,
      eff2: effects.eff2!,
      effv2: effects.effv2!,
      eff3: effects.eff3!,
      effv3: effects.effv3!,
      quantity,
    });
  }

  return { ok: true, items };
}

function integer(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value !== "string" || !/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  return Number.isSafeInteger(parsed) ? parsed : null;
}
