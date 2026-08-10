import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { revenueAdminRpc } from "@/lib/web-api/revenue-admin-client";
import { httpPeriod, httpTopBuyer, parsePaging, parseWindow } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;

  const window = parseWindow(params);
  if (!window.ok) return window.response;

  const paging = parsePaging(params, 50, 100);

  let resp;
  try {
    resp = await revenueAdminRpc("ListTopBuyers", {
      moderator_id: guard.moderatorId,
      window: window.value,
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
    buyers: (resp.buyers ?? []).map(httpTopBuyer),
  });
}
