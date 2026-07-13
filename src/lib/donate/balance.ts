import "server-only";
import { cache } from "react";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";

// Memoized per-request: the portal layout and the dashboard page both need
// the account's donate balance, and this dedupes them to a single gRPC call.
export const getDonateBalance = cache(async (accountId: string): Promise<string | null> => {
  try {
    const resp = await donateShopRpc("GetBalance", { account_id: accountId });
    return resp.balance ?? "0";
  } catch {
    return null;
  }
});
