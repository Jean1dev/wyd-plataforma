import { NextResponse } from "next/server";
import { dailyRewardRpc } from "@/lib/web-api/daily-reward-client";
import { upstreamError } from "@/lib/web-api/admin-http";

export async function GET() {
  try {
    const resp = await dailyRewardRpc("ListRewards", {});
    return NextResponse.json({ items: resp.items ?? [] });
  } catch {
    return upstreamError();
  }
}
