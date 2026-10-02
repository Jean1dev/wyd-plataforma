import { createHmac, randomBytes } from "node:crypto";

// One-time login code for the web client (w2pp-OpenWyd-WebClient ADR 017).
// The portal asks web-api's IssuePlayCode for a code; the web client then logs
// into the game with it once, so a signed-in player is not asked for the
// password again. web-api is reachable behind the public HTTPS edge without a
// client certificate, so the request carries an HMAC assertion that only the
// portal can sign. Same token format as the play ticket:
//   base64url(JSON {sub, iat, exp, jti}) "." base64url(HMAC-SHA256(secret, LABEL + payload))

export const PLAY_CODE_LABEL = "wyd-play-code.v1.";
export const PLAY_CODE_ASSERTION_LIFETIME_SECONDS = 60;
export const MIN_PLAY_CODE_SECRET_LENGTH = 32;
// Shape of a code (w2pp-OpenWYD internal/playcode): 10 symbols without look-alikes.
export const PLAY_CODE_PATTERN = /^[a-km-np-z2-9]{10}$/;
// Game login names: 4-12 lowercase alphanumerics (web-api account rules).
export const ACCOUNT_NAME_PATTERN = /^[a-z0-9]{4,12}$/;

export type PlayCodeClaims = { sub: string; iat: number; exp: number; jti: string };

export type PlayLogin = { name: string; code: string };

export function signPlayCodeAssertion(secret: string, claims: PlayCodeClaims): string {
  // Fixed key order keeps the payload byte-identical to the shared Go vector.
  const { sub, iat, exp, jti } = claims;
  const payload = Buffer.from(JSON.stringify({ sub, iat, exp, jti })).toString("base64url");
  const mac = createHmac("sha256", secret).update(PLAY_CODE_LABEL + payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function issuePlayCodeAssertion(secret: string, accountId: string, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  return signPlayCodeAssertion(secret, {
    sub: accountId,
    iat,
    exp: iat + PLAY_CODE_ASSERTION_LIFETIME_SECONDS,
    jti: randomBytes(16).toString("hex"),
  });
}

/** Reads PLAY_CODE_SECRET; null when absent or too short (feature off). */
export function playCodeSecret(env: Record<string, string | undefined>): string | null {
  const secret = env.PLAY_CODE_SECRET ?? "";
  return secret.length >= MIN_PLAY_CODE_SECRET_LENGTH ? secret : null;
}

/** Accepts web-api's answer only when it is a well-formed login. */
export function playLoginFrom(res: { result?: string; account_name?: string; code?: string } | null | undefined): PlayLogin | null {
  if (!res || res.result !== "PLAY_CODE_RESULT_OK") return null;
  const name = res.account_name ?? "";
  const code = res.code ?? "";
  if (!ACCOUNT_NAME_PATTERN.test(name) || !PLAY_CODE_PATTERN.test(code)) return null;
  return { name, code };
}
