import { NextResponse } from "next/server";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";
import { upstreamError } from "@/lib/web-api/admin-http";

export async function GET() {
  try {
    const resp = await donateShopRpc("ListShopItems", {});
    return NextResponse.json({ items: resp.items ?? [] });
  } catch {
    return upstreamError();
  }
}
