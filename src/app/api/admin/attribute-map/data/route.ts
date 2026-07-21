import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { upstreamError } from "@/lib/web-api/admin-http";
import { ATTRIBUTE_MAP_SIZE } from "@/lib/attribute-map/types";
import { attributeMapAdminRpc } from "@/lib/web-api/attribute-map-admin-client";
import { adminResultJson, binaryPayload, SNAPSHOT_REQUEST } from "../_shared";

export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await attributeMapAdminRpc("TransformAttributeMap", {
      moderator_id: guard.moderatorId,
      ...SNAPSHOT_REQUEST,
    });
  } catch {
    return upstreamError();
  }

  if (resp.result !== "ADMIN_RESULT_OK") return adminResultJson(resp.result);

  const data = binaryPayload(resp);
  if (!data) {
    return NextResponse.json({ error: "upstream_payload_invalid" }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${resp.filename || "AttributeMap.dat"}"`,
      "content-length": String(ATTRIBUTE_MAP_SIZE),
      "content-type": "application/octet-stream",
      "x-attribute-map-sha256": resp.new_sha256 || resp.original_sha256 || "",
    },
  });
}
