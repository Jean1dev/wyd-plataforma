import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { dailyRewardAdminRpc } from "@/lib/web-api/daily-reward-admin-client";
import { parseDailyRewardItemBody } from "../parse";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const { id } = await params;
  if (!/^\d+$/.test(id) || id === "0") return NextResponse.json({ error: "item_id_invalid" }, { status: 422 });

  const parsed = parseDailyRewardItemBody(await req.json().catch(() => null), id);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await dailyRewardAdminRpc("UpsertRewardItem", { moderator_id: guard.moderatorId, item: parsed.value });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ item_id: resp.item_id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const { id } = await params;
  if (!/^\d+$/.test(id) || id === "0") return NextResponse.json({ error: "item_id_invalid" }, { status: 422 });

  let resp;
  try {
    resp = await dailyRewardAdminRpc("DeleteRewardItem", { moderator_id: guard.moderatorId, item_id: id });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
