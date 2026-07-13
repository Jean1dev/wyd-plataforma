import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";
import { upstreamError } from "@/lib/web-api/admin-http";
import type { BuyResult } from "@/lib/donate/types";

const STATUS: Record<BuyResult, number> = {
  BUY_RESULT_OK: 200,
  BUY_RESULT_INSUFFICIENT_FUNDS: 402,
  BUY_RESULT_NOT_FOUND: 404,
  BUY_RESULT_DISABLED: 409,
  BUY_RESULT_UNSPECIFIED: 500,
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { shop_item_id?: unknown } | null;
  const shopItemId = typeof body?.shop_item_id === "string" ? body.shop_item_id : String(body?.shop_item_id ?? "");
  if (!/^\d+$/.test(shopItemId) || shopItemId === "0") {
    return NextResponse.json({ error: "shop_item_id_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await donateShopRpc("Buy", { account_id: session.accountId, shop_item_id: shopItemId });
  } catch {
    return upstreamError();
  }

  const status = STATUS[resp.result] ?? 500;
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({
    ok: true,
    new_balance: resp.new_balance,
    message: "Item será entregue no seu armazém no próximo login.",
  });
}
