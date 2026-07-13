import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { donateAdminRpc } from "@/lib/web-api/donate-admin-client";

export async function POST(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const accountId = typeof body?.account_id === "string" ? body.account_id.trim() : String(body?.account_id ?? "");
  const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!/^\d+$/.test(accountId) || accountId === "0") {
    return NextResponse.json({ error: "account_id_invalid" }, { status: 422 });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await donateAdminRpc("CreditDonateBalance", {
      moderator_id: guard.moderatorId,
      account_id: accountId,
      amount,
      reason,
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ new_balance: resp.new_balance });
}
