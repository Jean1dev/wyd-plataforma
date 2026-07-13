import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dailyRewardRpc } from "@/lib/web-api/daily-reward-client";
import { upstreamError } from "@/lib/web-api/admin-http";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const resp = await dailyRewardRpc("GetClaimStatus", { account_id: session.accountId });
    return NextResponse.json({
      claimed_today: resp.claimed_today ?? false,
      claimed_item_id: resp.claimed_item_id ?? "0",
      claimed_item_title: resp.claimed_item_title ?? "",
    });
  } catch {
    return upstreamError();
  }
}
