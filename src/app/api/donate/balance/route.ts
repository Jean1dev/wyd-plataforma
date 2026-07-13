import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";
import { upstreamError } from "@/lib/web-api/admin-http";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const resp = await donateShopRpc("GetBalance", { account_id: session.accountId });
    return NextResponse.json({ balance: resp.balance ?? "0" });
  } catch {
    return upstreamError();
  }
}
