import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dailyRewardRpc } from "@/lib/web-api/daily-reward-client";
import { upstreamError } from "@/lib/web-api/admin-http";
import type { ClaimResult } from "@/lib/daily-reward/types";

const STATUS: Record<ClaimResult, number> = {
  CLAIM_RESULT_OK: 200,
  CLAIM_RESULT_ALREADY_CLAIMED: 409,
  CLAIM_RESULT_NOT_FOUND: 404,
  CLAIM_RESULT_DISABLED: 409,
  CLAIM_RESULT_UNSPECIFIED: 500,
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { reward_item_id?: unknown } | null;
  const rewardItemId =
    typeof body?.reward_item_id === "string" ? body.reward_item_id : String(body?.reward_item_id ?? "");
  if (!/^\d+$/.test(rewardItemId) || rewardItemId === "0") {
    return NextResponse.json({ error: "reward_item_id_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await dailyRewardRpc("Claim", { account_id: session.accountId, reward_item_id: rewardItemId });
  } catch {
    return upstreamError();
  }

  const status = STATUS[resp.result] ?? 500;
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({
    ok: true,
    message: "Item será entregue no seu armazém no próximo login.",
  });
}
