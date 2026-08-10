import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { revenueAdminRpc } from "@/lib/web-api/revenue-admin-client";
import { httpAccount, parseAccountQuery, parsePaging } from "../_shared";

export async function GET(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  const params = new URL(req.url).searchParams;

  const query = parseAccountQuery(params);
  if (!query.ok) return query.response;

  const paging = parsePaging(params, 20, 50);

  let resp;
  try {
    resp = await revenueAdminRpc("SearchAccounts", {
      moderator_id: guard.moderatorId,
      name_prefix: query.value,
      limit: paging.limit,
    });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({ accounts: (resp.accounts ?? []).map(httpAccount) });
}
