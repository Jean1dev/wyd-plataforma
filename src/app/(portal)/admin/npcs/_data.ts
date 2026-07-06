import "server-only";

import { getSession, isModerator } from "@/lib/auth/session";
import { npcAdminRpc } from "@/lib/web-api/npc-admin-client";
import type { AdminNpc } from "@/lib/npc/types";

export type AdminDataResult<T> =
  | { status: "ok"; data: T }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "upstream" };

// Reads for admin pages run server-side and derive moderator_id from the
// session. Role is checked locally to fail fast; the web-api stays authority.
async function moderatorId(): Promise<string | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return null;
  if (!isModerator(session)) return null;
  return session.accountId;
}

export async function listNpcs(): Promise<AdminDataResult<AdminNpc[]>> {
  const id = await moderatorId();
  if (!id) return { status: "forbidden" };

  try {
    const resp = await npcAdminRpc("ListNpcs", { moderator_id: id });
    if (resp.result === "ADMIN_RESULT_OK") return { status: "ok", data: resp.npcs };
    if (resp.result === "ADMIN_RESULT_FORBIDDEN") return { status: "forbidden" };
    return { status: "upstream" };
  } catch {
    return { status: "upstream" };
  }
}

export async function getNpc(npcId: string): Promise<AdminDataResult<AdminNpc>> {
  const id = await moderatorId();
  if (!id) return { status: "forbidden" };

  try {
    const resp = await npcAdminRpc("GetNpc", { moderator_id: id, npc_id: npcId });
    if (resp.result === "ADMIN_RESULT_OK" && resp.npc) return { status: "ok", data: resp.npc };
    if (resp.result === "ADMIN_RESULT_FORBIDDEN") return { status: "forbidden" };
    if (resp.result === "ADMIN_RESULT_NOT_FOUND") return { status: "not_found" };
    return { status: "upstream" };
  } catch {
    return { status: "upstream" };
  }
}

export async function currentUserIsModerator(): Promise<boolean> {
  return (await moderatorId()) != null;
}
