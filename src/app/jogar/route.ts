import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { issuePlayTicket, playTicketConfig, renderPlayForm } from "@/lib/play-ticket";

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

  return new NextResponse(renderPlayForm(config.webClientUrl, issuePlayTicket(config.secret, session.accountId)), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
    },
  });
}
