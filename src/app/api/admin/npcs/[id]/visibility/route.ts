import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { enabled?: unknown } | null;
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled_required" }, { status: 422 });
  }

  let resp;
  try {
    resp = await npcAdminRpc("SetNpcVisibility", {
      moderator_id: guard.moderatorId,
      npc_id: id,
      enabled: body.enabled,
    });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
