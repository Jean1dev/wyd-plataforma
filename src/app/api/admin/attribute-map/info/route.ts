import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { upstreamError } from "@/lib/web-api/admin-http";
import { attributeMapAdminRpc } from "@/lib/web-api/attribute-map-admin-client";
import { adminResultJson, httpInfo } from "../_shared";

export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await attributeMapAdminRpc("GetAttributeMapInfo", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  if (resp.result !== "ADMIN_RESULT_OK") return adminResultJson(resp.result);
  return NextResponse.json({ info: httpInfo(resp) }, { headers: { "cache-control": "no-store" } });
}
