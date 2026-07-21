import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";
import { httpDropItem, parseIncludeZero, parseItemIndex, textParam } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;
  const itemIndex = parseItemIndex(params);
  if (!itemIndex.ok) return itemIndex.response;

  const includeZero = parseIncludeZero(params);
  if (!includeZero.ok) return includeZero.response;

  let resp;
  try {
    resp = await npcAdminRpc("ListDropItems", {
      moderator_id: guard.moderatorId,
      item_index: itemIndex.value,
      item_query: textParam(params, "itemQuery"),
      mob_query: textParam(params, "mobQuery"),
      include_zero_drop_items: includeZero.value,
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({ items: (resp.items ?? []).map(httpDropItem) });
}
