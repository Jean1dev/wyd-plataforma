import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

type Ctx = { params: Promise<{ index: string }> };

const INT64_MIN = BigInt("-9223372036854775808");
const INT64_MAX = BigInt("9223372036854775807");

function int64Decimal(value: unknown): string | null {
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

// Global per-item price. price >= 0 sets the global override; price < 0 clears
// it (item falls back to the game catalog price).
export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const { index } = await params;
  const itemIndex = Number(index);
  if (!Number.isInteger(itemIndex) || itemIndex <= 0) {
    return NextResponse.json({ error: "item_index_invalid" }, { status: 422 });
  }

  const body = (await req.json().catch(() => null)) as { price?: unknown } | null;
  const price = int64Decimal(body?.price);
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
