import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { issuePlayTicket, PLAY_TICKET_LABEL, playTicketConfig, renderPlayForm, signPlayTicket } from "./play-ticket";

const secret = "0123456789abcdef0123456789abcdef";

// Same vector as gateway/internal/relay/portalauth_test.go (nodeTicket).
test("ticket matches the vector shared with the gateway", () => {
  const ticket = signPlayTicket(secret, { sub: "42", iat: 1790000000, exp: 1790000060, jti: "00112233445566778899aabbccddeeff" });
  assert.equal(
    ticket,
    "eyJzdWIiOiI0MiIsImlhdCI6MTc5MDAwMDAwMCwiZXhwIjoxNzkwMDAwMDYwLCJqdGkiOiIwMDExMjIzMzQ0NTU2Njc3ODg5OWFhYmJjY2RkZWVmZiJ9" +
      ".dCuY1pK96hIGTu52hxgE5trHZ7hsrBRWEOmzd4oWdOg",
  );
});

test("issued ticket lives 60 s, has a random jti and verifies", () => {
  const a = issuePlayTicket(secret, "7", 1_790_000_000_500);
  const b = issuePlayTicket(secret, "7", 1_790_000_000_500);
  const [payload, mac] = a.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.deepEqual(Object.keys(claims), ["sub", "iat", "exp", "jti"]);
  assert.equal(claims.sub, "7");
  assert.equal(claims.exp - claims.iat, 60);
  assert.match(claims.jti, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
  assert.equal(mac, createHmac("sha256", secret).update(PLAY_TICKET_LABEL + payload).digest("base64url"));
});

test("config requires a long secret and a bare https origin", () => {
  assert.deepEqual(playTicketConfig({ PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "https://wyd.up.railway.app/" }), {
    secret,
    webClientUrl: "https://wyd.up.railway.app",
  });
  assert.ok(playTicketConfig({ PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "http://localhost:8080" }));
  for (const env of [
    {},
    { PLAY_TICKET_SECRET: secret.slice(1), WEBCLIENT_URL: "https://a.example" },
    { PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "http://a.example" },
    { PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "https://a.example/client.html" },
    { PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "https://a.example?x=1" },
    { PLAY_TICKET_SECRET: secret, WEBCLIENT_URL: "javascript:alert(1)" },
  ]) {
    assert.equal(playTicketConfig(env), null, JSON.stringify(env));
  }
});

test("form posts the ticket in the body, escaped", () => {
  const html = renderPlayForm("https://a.example", 'x"><script>');
  assert.match(html, /<form method="post" action="https:\/\/a\.example\/auth\/portal">/);
  assert.match(html, /value="x&#34;&#62;&#60;script&#62;"/);
  assert.doesNotMatch(html, /auth\/portal\?/);
});
