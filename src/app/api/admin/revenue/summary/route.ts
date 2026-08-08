import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { revenueAdminRpc } from "@/lib/web-api/revenue-admin-client";
import { httpByMethod, httpPeriod, httpPoint, httpTotals, parseAccountId, parseBucket, parseWindow } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;

  const window = parseWindow(params);
  if (!window.ok) return window.response;

  const bucket = parseBucket(params);
  if (!bucket.ok) return bucket.response;

  const accountId = parseAccountId(params);
  if (!accountId.ok) return accountId.response;

  let resp;
  try {
    resp = await revenueAdminRpc("GetRevenueSummary", {
      moderator_id: guard.moderatorId,
      window: window.value,
      bucket: bucket.value,
      account_id: accountId.value,
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({
    period: httpPeriod(resp.from_unix, resp.to_unix),
    totals: httpTotals(resp.totals),
    byMethod: (resp.by_method ?? []).map(httpByMethod),
    series: (resp.series ?? []).map(httpPoint),
  });
}
