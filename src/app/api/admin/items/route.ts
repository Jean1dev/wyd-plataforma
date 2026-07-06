import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

// Backs the item_index combobox (shop + price). The catalog is large (~3200
// entries); the client loads it once and filters locally. An empty `items`
// list is valid (web-api without -content) — the form falls back to a manual
// numeric field.
export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await npcAdminRpc("ListItemCatalog", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ items: resp.items });
}
