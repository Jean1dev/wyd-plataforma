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

function eff(v: unknown): number {
  const n = int(v);
  return n == null ? 0 : n;
}

// Parses and validates the full shop (SetNpcShop replaces the whole shop).
// Mirrors the web-api validation: unique slots in [0,26], item_index > 0.
function parseItems(raw: unknown): { ok: true; items: AdminNpcShopItem[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "items_required" };

  const seen = new Set<number>();
  const items: AdminNpcShopItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "item_invalid" };
    const e = entry as Record<string, unknown>;

    const slot = int(e.slot);
    const item_index = int(e.item_index);
    if (slot == null || slot < 0 || slot >= SHOP_SLOT_COUNT) return { ok: false, error: "slot_out_of_range" };
    if (seen.has(slot)) return { ok: false, error: "slot_duplicated" };
    if (item_index == null || item_index <= 0) return { ok: false, error: "item_index_invalid" };
    seen.add(slot);

    items.push({
      slot,
      item_index,
      eff1: eff(e.eff1),
      effv1: eff(e.effv1),
      eff2: eff(e.eff2),
      effv2: eff(e.effv2),
      eff3: eff(e.eff3),
      effv3: eff(e.effv3),
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
