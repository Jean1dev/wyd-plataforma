import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { parseInt64Decimal, parsePositiveInt32 } from "@/lib/npc/validation";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

type Ctx = { params: Promise<{ index: string }> };

// Global per-item price. price >= 0 sets the global override; price < 0 clears
// it (item falls back to the game catalog price).
export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const { index } = await params;
  const itemIndex = parsePositiveInt32(index);
  if (itemIndex == null) {
    return NextResponse.json({ error: "item_index_invalid" }, { status: 422 });
  }

  const body = (await req.json().catch(() => null)) as { price?: unknown } | null;
  const price = parseInt64Decimal(body?.price);
  if (price == null) {
    return NextResponse.json({ error: "price_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await npcAdminRpc("SetItemPrice", {
      moderator_id: guard.moderatorId,
      item_index: itemIndex,
      price,
    });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
