import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export type SessionData = {
  accountId?: string;
  name?: string;
  isLoggedIn?: boolean;
  // Account role as reported by the web-api at login ("player" | "moderator" |
  // "admin"). Used only to gate the moderation UI; the web-api stays the
  // authority on authorization.
  role?: string;
};

const MODERATOR_ROLES = new Set(["moderator", "admin"]);

export function isModerator(session: Pick<SessionData, "role">): boolean {
  return session.role != null && MODERATOR_ROLES.has(session.role);
}

const devPassword = "wyd-plataforma-dev-session-password-change-me";

function sessionPassword() {
  const password = process.env.SESSION_PASSWORD;
  if (password) {
    return password;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: SESSION_PASSWORD");
  }

  return devPassword;
}

export function sessionOptions(): SessionOptions {
  return {
    cookieName: "wyd_session",
    password: sessionPassword(),
    ttl: 60 * 60 * 24 * 7,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}
