import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";
import { httpMobDrop, parseItemIndex, textParam } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;
  const itemIndex = parseItemIndex(params);
  if (!itemIndex.ok) return itemIndex.response;

  let resp;
  try {
    resp = await npcAdminRpc("ListMobDrops", {
      moderator_id: guard.moderatorId,
      mob_query: textParam(params, "mobQuery"),
      item_index: itemIndex.value,
      item_query: textParam(params, "itemQuery"),
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({ mobs: (resp.mobs ?? []).map(httpMobDrop) });
}
