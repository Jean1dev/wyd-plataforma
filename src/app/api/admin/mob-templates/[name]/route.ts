import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { mobTemplateAdminRpc } from "@/lib/web-api/mob-template-admin-client";
import { parseMobTemplateStatBody } from "./parse";

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const { name } = await params;

  let resp;
  try {
    resp = await mobTemplateAdminRpc("GetMobTemplateStat", { moderator_id: guard.moderatorId, template_name: name });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ stat: resp.stat });
}

// Creates the first override (when none exists yet) or replaces it in full —
// UpsertMobTemplateStat is not partial. equip is never sent here; it is a
// sub-resource written only via PUT .../equip.
export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { name } = await params;

  const parsed = parseMobTemplateStatBody(await req.json().catch(() => null), name);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await mobTemplateAdminRpc("UpsertMobTemplateStat", { moderator_id: guard.moderatorId, stat: parsed.value });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}

// Removes the override; the template reverts to read-through raw-file values.
// Never touches the npc/ file itself.
export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { name } = await params;

  let resp;
  try {
    resp = await mobTemplateAdminRpc("DeleteMobTemplateStat", { moderator_id: guard.moderatorId, template_name: name });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
