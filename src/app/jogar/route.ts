import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { issuePlayCodeAssertion, playCodeSecret, playLoginFrom, type PlayLogin } from "@/lib/play-code";
import { issuePlayTicket, playTicketConfig, renderPlayForm } from "@/lib/play-ticket";
import { issuePlayCodeRpc } from "@/lib/web-api/client";

// How long opening the game may wait for web-api before falling back to the
// manual login in the game.
const PLAY_CODE_TIMEOUT_MS = 1500;

// One-time game login for the signed-in account (web client ADR 017). Any
// failure only means the player types the password in the game, as before.
async function playLogin(accountId: string): Promise<PlayLogin | null> {
  const secret = playCodeSecret(process.env);
  if (!secret) return null;
  try {
    const res = await issuePlayCodeRpc({ assertion: issuePlayCodeAssertion(secret, accountId) }, PLAY_CODE_TIMEOUT_MS);
    return playLoginFrom(res);
  } catch {
    return null;
  }
}

// Entry point of the web client: the gateway sends visitors without a session
// here. Without a portal session, log in or sign up first and come back.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.redirect(new URL("/?next=/jogar", req.url), 303);
  }

  const config = playTicketConfig(process.env);
  if (!config) {
    return new NextResponse("Jogo no navegador indisponivel no momento.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const login = await playLogin(session.accountId);
  return new NextResponse(renderPlayForm(config.webClientUrl, issuePlayTicket(config.secret, session.accountId, Date.now(), login)), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
    },
  });
}
