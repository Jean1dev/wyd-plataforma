import "server-only";

import { getSession, isModerator } from "@/lib/auth/session";
import { mobTemplateAdminRpc } from "@/lib/web-api/mob-template-admin-client";
import type { AdminMobTemplateStat } from "@/lib/mob-template/types";

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

export async function currentUserIsModerator(): Promise<boolean> {
  return (await moderatorId()) != null;
}

// GetMobTemplateStat is a read-through: overridden === false is a normal
// state (values come straight from the raw npc/ file), not an error.
export async function getMobTemplateStat(templateName: string): Promise<AdminDataResult<AdminMobTemplateStat>> {
  const id = await moderatorId();
  if (!id) return { status: "forbidden" };

  try {
    const resp = await mobTemplateAdminRpc("GetMobTemplateStat", { moderator_id: id, template_name: templateName });
    if (resp.result === "ADMIN_RESULT_OK" && resp.stat) return { status: "ok", data: resp.stat };
    if (resp.result === "ADMIN_RESULT_FORBIDDEN") return { status: "forbidden" };
    if (resp.result === "ADMIN_RESULT_NOT_FOUND") return { status: "not_found" };
    return { status: "upstream" };
  } catch {
    return { status: "upstream" };
  }
}
