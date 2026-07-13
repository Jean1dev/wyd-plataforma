import { NextResponse } from "next/server";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";
import type { TopupResult } from "@/lib/donate/types";

// Exhaustive result -> HTTP map (same convention as admin-http.ts /
// donate/buy). CONFIRMED and ALREADY_CONFIRMED are both success (idempotent);
// UNSPECIFIED — the proto3 default a decode error or wire-format desync would
// yield — must surface as an upstream failure (502) so the provider retries,
// never a silent 204 that abandons the order as PENDING.
const STATUS: Record<TopupResult, number> = {
  TOPUP_RESULT_CONFIRMED: 204,
  TOPUP_RESULT_ALREADY_CONFIRMED: 204,
  TOPUP_RESULT_NOT_FOUND: 404,
  TOPUP_RESULT_UNSPECIFIED: 502,
};

// Public webhook called by the internal payment service when a payment settles.
// The payment service can't send an auth header today, so this route is open —
// integrity is enforced in the database, not at the edge: correlation is by an
// unguessable `externalReference` (UUID) and web-api's ConfirmTopupOrder only
// flips a real PENDING order to PAID (NOT_FOUND otherwise) and is idempotent, so
// a replayed or bogus call never double-credits or credits a non-existent order.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const externalRef = typeof body?.externalRef === "string" ? body.externalRef.trim() : "";
  if (!externalRef) {
    return NextResponse.json({ error: "external_ref_required" }, { status: 422 });
  }

  let resp;
  try {
    resp = await donateTopupRpc("ConfirmTopupOrder", { external_reference: externalRef });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const status = STATUS[resp.result] ?? 502;
  if (status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ result: resp.result }, { status });
}
