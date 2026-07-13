import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";

// Polled by the browser while the player pays. Returns the order status (scoped
// to the session account so an order can't be read across accounts) and, once
// paid, the new balance for the UI to display.
export async function GET(_req: Request, { params }: { params: Promise<{ externalRef: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { externalRef } = await params;
  if (!externalRef) {
    return NextResponse.json({ error: "external_ref_required" }, { status: 422 });
  }

  let resp;
  try {
    resp = await donateTopupRpc("GetTopupOrder", {
      external_reference: externalRef,
      account_id: session.accountId,
    });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  if (resp.status === "TOPUP_STATUS_UNSPECIFIED") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    status: resp.status,
    paid: resp.status === "TOPUP_STATUS_PAID",
    credits: resp.credits,
    new_balance: resp.new_balance,
  });
}
