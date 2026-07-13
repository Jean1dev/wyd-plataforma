import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { donateAdminRpc } from "@/lib/web-api/donate-admin-client";
import { parseDonateShopItemBody } from "./parse";

export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await donateAdminRpc("ListShopItems", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ items: resp.items ?? [] });
}

export async function POST(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const parsed = parseDonateShopItemBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await donateAdminRpc("UpsertShopItem", { moderator_id: guard.moderatorId, item: parsed.value });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ item_id: resp.item_id });
}
