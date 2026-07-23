import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { ackResponse, upstreamError } from "@/lib/web-api/admin-http";
import { mobTemplateAdminRpc } from "@/lib/web-api/mob-template-admin-client";
import { parseMobTemplateEquipItems } from "../parse";

type Ctx = { params: Promise<{ name: string }> };

// Replaces the whole 16-slot equip list (full replace, not a diff). Requires
// a saved override to already exist for this template — otherwise the
// web-api returns ADMIN_RESULT_NOT_FOUND (surfaced here as 404); save the
// stats form at least once first.
export async function PUT(req: Request, { params }: Ctx) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;
  const { name } = await params;

  const body = (await req.json().catch(() => null)) as { items?: unknown } | null;
  const parsed = parseMobTemplateEquipItems(body?.items);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await mobTemplateAdminRpc("SetMobTemplateEquip", {
      moderator_id: guard.moderatorId,
      template_name: name,
      items: parsed.value,
    });
  } catch {
    return upstreamError();
  }

  return ackResponse(resp.result);
}
