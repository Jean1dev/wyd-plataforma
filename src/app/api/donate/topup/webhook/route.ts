import { NextResponse } from "next/server";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";

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

  if (resp.result === "TOPUP_RESULT_NOT_FOUND") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // CONFIRMED and ALREADY_CONFIRMED are both success (idempotent).
  return new NextResponse(null, { status: 204 });
}
