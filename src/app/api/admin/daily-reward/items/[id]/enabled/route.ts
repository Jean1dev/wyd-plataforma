import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { dailyRewardAdminRpc } from "@/lib/web-api/daily-reward-admin-client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const { id } = await params;
  if (!/^\d+$/.test(id) || id === "0") return NextResponse.json({ error: "item_id_invalid" }, { status: 422 });

  const body = (await req.json().catch(() => null)) as { enabled?: unknown } | null;
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await dailyRewardAdminRpc("SetRewardItemEnabled", {
      moderator_id: guard.moderatorId,
      item_id: id,
      enabled: body.enabled,
    });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
