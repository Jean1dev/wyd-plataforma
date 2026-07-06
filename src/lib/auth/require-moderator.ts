import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSession, isModerator, type SessionData } from "./session";

export type ModeratorGuardOk = { ok: true; session: SessionData; moderatorId: string };
export type ModeratorGuardFail = { ok: false; response: NextResponse };

// Guards an admin API route: the caller must have a logged-in session. The
// moderator_id is ALWAYS derived from the session cookie, never from the body.
// Authorization by role is left to the web-api (a player gets FORBIDDEN); the
// session role, when present, only lets us fail fast with 403.
export async function requireModerator(): Promise<ModeratorGuardOk | ModeratorGuardFail> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.accountId) {
    return { ok: false, response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  // If we already know the role and it isn't a moderator/admin, short-circuit.
  // When the role is unknown we still call through — the web-api decides.
  if (session.role != null && !isModerator(session)) {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { ok: true, session, moderatorId: session.accountId };
}

// Same-origin check for mutating requests. The session cookie is SameSite=Lax,
// but state-changing methods still validate the Origin header to blunt CSRF,
// since there is no CSRF-token infrastructure yet.
export async function assertSameOrigin(): Promise<NextResponse | null> {
  const h = await headers();
  const origin = h.get("origin");

  // Same-origin fetch() from our own pages always sends Origin. A missing
  // Origin on a mutation is treated as untrusted.
  if (!origin) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  const host = h.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!host || originHost !== host) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  return null;
}
