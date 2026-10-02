import { createHmac, randomBytes } from "node:crypto";

// Ticket that admits a portal account into the web client (gateway of the
// w2pp-OpenWyd-WebClient repo, ADR 015). Format, shared with the gateway:
//   base64url(JSON {sub, iat, exp, jti}) "." base64url(HMAC-SHA256(secret, LABEL + payload))
// It is posted in a form body (never in a URL) and the gateway accepts each
// jti once. It carries no password, name or role.

export const PLAY_TICKET_LABEL = "wyd-play-ticket.v1.";
export const PLAY_TICKET_LIFETIME_SECONDS = 60;
export const MIN_PLAY_TICKET_SECRET_LENGTH = 32;

export type PlayTicketClaims = { sub: string; iat: number; exp: number; jti: string };

export type PlayTicketConfig = { secret: string; webClientUrl: string };

export function signPlayTicket(secret: string, claims: PlayTicketClaims): string {
  // Fixed key order keeps the payload byte-identical to the shared test vector.
  const { sub, iat, exp, jti } = claims;
  const payload = Buffer.from(JSON.stringify({ sub, iat, exp, jti })).toString("base64url");
  const mac = createHmac("sha256", secret).update(PLAY_TICKET_LABEL + payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function issuePlayTicket(secret: string, accountId: string, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  return signPlayTicket(secret, {
    sub: accountId,
    iat,
    exp: iat + PLAY_TICKET_LIFETIME_SECONDS,
    jti: randomBytes(16).toString("hex"),
  });
}

/** Reads PLAY_TICKET_SECRET and WEBCLIENT_URL; null when absent or unsafe. */
export function playTicketConfig(env: Record<string, string | undefined>): PlayTicketConfig | null {
  const secret = env.PLAY_TICKET_SECRET ?? "";
  const raw = (env.WEBCLIENT_URL ?? "").trim();
  if (secret.length < MIN_PLAY_TICKET_SECRET_LENGTH || !raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
  if ((url.pathname !== "/" && url.pathname !== "") || url.search || url.username || url.password) return null;
  return { secret, webClientUrl: url.origin };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Self-submitting form; the button covers browsers without JavaScript. */
export function renderPlayForm(webClientUrl: string, ticket: string): string {
  const action = escapeHtml(`${webClientUrl}/auth/portal`);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Abrindo o jogo</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#14110c;color:#e8dcc0;font:16px system-ui,sans-serif}
button{margin-top:16px;padding:10px 22px;border:1px solid #b8892f;border-radius:6px;background:#3a2a10;color:#f4d78a;font:inherit;cursor:pointer}
</style>
</head>
<body>
<form method="post" action="${action}">
<input type="hidden" name="ticket" value="${escapeHtml(ticket)}">
<p>Abrindo o jogo no navegador...</p>
<button type="submit">Continuar</button>
</form>
<script>document.forms[0].submit()</script>
</body>
</html>
`;
}
