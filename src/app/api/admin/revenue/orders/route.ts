import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { revenueAdminRpc } from "@/lib/web-api/revenue-admin-client";
import {
  httpPeriod,
  httpTopupOrder,
  parseAccountId,
  parseMethod,
  parsePaging,
  parseStatus,
  parseWindow,
} from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;

  const window = parseWindow(params);
  if (!window.ok) return window.response;

  const status = parseStatus(params);
  if (!status.ok) return status.response;

  const method = parseMethod(params);
  if (!method.ok) return method.response;

  const accountId = parseAccountId(params);
  if (!accountId.ok) return accountId.response;

  const paging = parsePaging(params, 50, 100);

  let resp;
  try {
    resp = await revenueAdminRpc("ListTopupOrders", {
      moderator_id: guard.moderatorId,
      window: window.value,
      status: status.value,
      payment_method: method.value,
      account_id: accountId.value,
      limit: paging.limit,
      offset: paging.offset,
    });
  } catch {
    return upstreamError();
  }

  const httpStatus = httpForAdminResult(resp.result);
  if (httpStatus !== 200) return NextResponse.json({ result: resp.result }, { status: httpStatus });

  return NextResponse.json({
    period: httpPeriod(resp.from_unix, resp.to_unix),
    totalCount: resp.total_count ?? 0,
    orders: (resp.orders ?? []).map(httpTopupOrder),
  });
}
