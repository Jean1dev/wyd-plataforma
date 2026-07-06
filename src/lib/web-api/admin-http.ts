import { NextResponse } from "next/server";
import type { AdminResult } from "./npc-admin-client";

// Maps an AdminResult (business outcome, travels in the body) to the HTTP
// status the BFF exposes to the browser. gRPC rejects are infrastructure
// failures and must be handled separately as 502 — never routed through here.
const STATUS: Record<AdminResult, number> = {
  ADMIN_RESULT_OK: 200,
  ADMIN_RESULT_FORBIDDEN: 403,
  ADMIN_RESULT_INVALID: 422,
  ADMIN_RESULT_NOT_FOUND: 404,
  ADMIN_RESULT_UNSPECIFIED: 500,
};

export function httpForAdminResult(result: AdminResult): number {
  return STATUS[result] ?? 500;
}

// Standard upstream-failure response for a rejected gRPC call.
export function upstreamError(): NextResponse {
  return NextResponse.json({ error: "upstream" }, { status: 502 });
}

// For an AdminAck-style response: 200 on OK, otherwise the mapped status with
// the raw result so the client can render a message.
export function ackResponse(result: AdminResult): NextResponse {
  const status = httpForAdminResult(result);
  if (status === 200) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ result }, { status });
}
