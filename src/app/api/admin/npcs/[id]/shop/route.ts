import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { SHOP_SLOT_COUNT } from "@/lib/npc/domain";
import { parseNpcShopItems } from "@/lib/npc/validation";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { items?: unknown } | null;
  const parsed = parseNpcShopItems(body?.items, SHOP_SLOT_COUNT);
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
