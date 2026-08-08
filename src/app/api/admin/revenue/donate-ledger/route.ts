import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { revenueAdminRpc } from "@/lib/web-api/revenue-admin-client";
import { httpLedgerEntry, httpPeriod, parseAccountId, parseLedgerAction, parsePaging, parseWindow } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;

  const window = parseWindow(params);
  if (!window.ok) return window.response;

  const action = parseLedgerAction(params);
  if (!action.ok) return action.response;

  // Matched against the SUBJECT of the movement (whose wallet moved), not the
  // raw donate_shop_audit.account_id column.
  const accountId = parseAccountId(params);
  if (!accountId.ok) return accountId.response;

  const paging = parsePaging(params, 50, 100);

  let resp;
  try {
    resp = await revenueAdminRpc("ListDonateSpend", {
      moderator_id: guard.moderatorId,
      window: window.value,
      action: action.value,
      account_id: accountId.value,
      limit: paging.limit,
      offset: paging.offset,
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({
    period: httpPeriod(resp.from_unix, resp.to_unix),
    totalCount: resp.total_count ?? 0,
    entries: (resp.entries ?? []).map(httpLedgerEntry),
  });
}
