import { getSession, isModerator } from "@/lib/auth/session";
import type { AdminRewardLoadState } from "@/lib/daily-reward/types";
import { dailyRewardAdminRpc } from "@/lib/web-api/daily-reward-admin-client";

async function moderatorId(): Promise<string | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return null;
  if (!isModerator(session)) return null;
  return session.accountId;
}

export async function listRewardItems(): Promise<AdminRewardLoadState> {
  const id = await moderatorId();
  if (!id) return { status: "forbidden", items: [] };

  try {
    const resp = await dailyRewardAdminRpc("ListRewardItems", { moderator_id: id });
    if (resp.result === "ADMIN_RESULT_FORBIDDEN") return { status: "forbidden", items: [] };
    if (resp.result !== "ADMIN_RESULT_OK") return { status: "unavailable", items: [] };
    return { status: "ok", items: resp.items ?? [] };
  } catch {
    return { status: "unavailable", items: [] };
  }
}
