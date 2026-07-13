import { getSession, isModerator } from "@/lib/auth/session";
import type { AdminDonateLoadState } from "@/lib/donate/types";
import { donateAdminRpc } from "@/lib/web-api/donate-admin-client";

async function moderatorId(): Promise<string | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return null;
  if (!isModerator(session)) return null;
  return session.accountId;
}

export async function listDonateItems(): Promise<AdminDonateLoadState> {
  const id = await moderatorId();
  if (!id) return { status: "forbidden", items: [] };

  try {
    const resp = await donateAdminRpc("ListShopItems", { moderator_id: id });
    if (resp.result === "ADMIN_RESULT_FORBIDDEN") return { status: "forbidden", items: [] };
    if (resp.result !== "ADMIN_RESULT_OK") return { status: "unavailable", items: [] };
    return { status: "ok", items: resp.items ?? [] };
  } catch {
    return { status: "unavailable", items: [] };
  }
}
