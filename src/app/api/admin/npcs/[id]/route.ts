import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";
import { parseUpsertBody } from "../upsert";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let resp;
  try {
    resp = await npcAdminRpc("GetNpc", { moderator_id: guard.moderatorId, npc_id: id });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ npc: resp.npc });
}

export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  await params; // id is informational; UpsertNpc keys on slug in the body.

  const parsed = parseUpsertBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await npcAdminRpc("UpsertNpc", { moderator_id: guard.moderatorId, ...parsed.value });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ npc_id: resp.npc_id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { id } = await params;

  let resp;
  try {
    resp = await npcAdminRpc("DeleteNpc", { moderator_id: guard.moderatorId, npc_id: id });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
