import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { upstreamError } from "@/lib/web-api/admin-http";
import { attributeMapAdminRpc } from "@/lib/web-api/attribute-map-admin-client";
import { adminResultJson, binaryPayload, parseTransformBody, transformJson } from "../_shared";

export async function POST(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const parsed = parseTransformBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let resp;
  try {
    resp = await attributeMapAdminRpc("TransformAttributeMap", {
      moderator_id: guard.moderatorId,
      ...parsed.value,
    });
  } catch {
    return upstreamError();
  }

  if (resp.result !== "ADMIN_RESULT_OK") return adminResultJson(resp.result);

  const data = binaryPayload(resp);
  if (!data) {
    return NextResponse.json({ error: "upstream_payload_invalid" }, { status: 502 });
  }

  return NextResponse.json(transformJson(resp, data), { headers: { "cache-control": "no-store" } });
}
