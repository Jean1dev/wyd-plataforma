import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { SHOP_SLOT_COUNT } from "@/lib/npc/domain";
import { npcAdminRpc, type AdminNpcShopItem } from "@/lib/web-api/npc-admin-client";

type Ctx = { params: Promise<{ id: string }> };

function int(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
}

function optionalInt32(v: unknown): number | null {
  if (v == null || v === "") return 0;
  const n = int(v);
  return n != null && n >= -2147483648 && n <= 2147483647 ? n : null;
}

function quantity(v: unknown): { ok: true; value: number } | { ok: false } {
  if (v == null || v === "") return { ok: true, value: 1 };
  const n = int(v);
  if (n == null) return { ok: false };
  return { ok: true, value: n === 0 ? 1 : n };
}

// Parses and validates the full shop (SetNpcShop replaces the whole shop).
// Mirrors the web-api validation: unique slots in [0,26], item_index > 0,
// quantity normalized to 1..255 (0/absent -> 1).
function parseItems(raw: unknown): { ok: true; items: AdminNpcShopItem[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "items_required" };

  const seen = new Set<number>();
  const items: AdminNpcShopItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "item_invalid" };
    const e = entry as Record<string, unknown>;

    const slot = int(e.slot);
    const item_index = int(e.item_index);
    const qty = quantity(e.quantity);
    const eff1 = optionalInt32(e.eff1);
    const effv1 = optionalInt32(e.effv1);
    const eff2 = optionalInt32(e.eff2);
    const effv2 = optionalInt32(e.effv2);
    const eff3 = optionalInt32(e.eff3);
    const effv3 = optionalInt32(e.effv3);
    if (slot == null || slot < 0 || slot >= SHOP_SLOT_COUNT) return { ok: false, error: "slot_out_of_range" };
    if (seen.has(slot)) return { ok: false, error: "slot_duplicated" };
    if (item_index == null || item_index <= 0) return { ok: false, error: "item_index_invalid" };
    if (!qty.ok) return { ok: false, error: "quantity_invalid" };
    if (qty.value < 1 || qty.value > 255) return { ok: false, error: "quantity_invalid" };
    if ([eff1, effv1, eff2, effv2, eff3, effv3].some((v) => v == null)) {
      return { ok: false, error: "effect_invalid" };
    }
    if (eff1 === 61 || eff2 === 61 || eff3 === 61) {
      return { ok: false, error: "effect_amount_derived" };
    }
    seen.add(slot);

    items.push({
      slot,
      item_index,
      eff1: eff1!,
      effv1: effv1!,
      eff2: eff2!,
      effv2: effv2!,
      eff3: eff3!,
      effv3: effv3!,
      quantity: qty.value,
    });
  }

  return { ok: true, items };
}

export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { items?: unknown } | null;
  const parsed = parseItems(body?.items);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await npcAdminRpc("SetNpcShop", {
      moderator_id: guard.moderatorId,
      npc_id: id,
      items: parsed.items,
    });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
