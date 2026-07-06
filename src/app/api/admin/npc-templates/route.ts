import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";

// Backs the template_name combobox. An empty `templates` list is a VALID
// response (web-api started without -content) — the form falls back to a manual
// field, so it is returned as 200, not an error.
export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await npcAdminRpc("ListMerchantTemplates", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ templates: resp.templates });
}
