import "server-only";

import { getSession, isModerator } from "@/lib/auth/session";

// Server components can't use requireModerator() — that returns a NextResponse.
// Same inline shape as admin/donate/_data.ts's moderatorId().
//
// This is page visibility only. web-api re-checks account.role on every RPC, so
// a tampered session cookie still gets ADMIN_RESULT_FORBIDDEN.
export async function currentUserIsModerator(): Promise<boolean> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return false;

  return isModerator(session);
}
