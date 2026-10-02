import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  issuePlayCodeAssertion,
  PLAY_CODE_LABEL,
  playCodeSecret,
  playLoginFrom,
  signPlayCodeAssertion,
} from "./play-code";
import { issuePlayTicket } from "./play-ticket";

const secret = "wyd-play-code-test-secret-0123456789abcdef";

// Same vector as w2pp-OpenWYD internal/playcode/playcode_test.go (nodeVector).
test("assertion matches the vector shared with web-api", () => {
  const token = signPlayCodeAssertion(secret, {
    sub: "42",
    iat: 1790000000,
    exp: 1790000060,
    jti: "0123456789abcdef0123456789abcdef",
  });
  assert.equal(
    token,
    "eyJzdWIiOiI0MiIsImlhdCI6MTc5MDAwMDAwMCwiZXhwIjoxNzkwMDAwMDYwLCJqdGkiOiIwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZiJ9" +
      ".O52BvFIj7L-JOw8oVCdC6Sh5IxFUtDc-yDM4VhheYgE",
  );
});

test("issued assertion lives 60 s, has a random jti and verifies", () => {
  const a = issuePlayCodeAssertion(secret, "7", 1_790_000_000_500);
  const b = issuePlayCodeAssertion(secret, "7", 1_790_000_000_500);
  const [payload, mac] = a.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.deepEqual(Object.keys(claims), ["sub", "iat", "exp", "jti"]);
  assert.equal(claims.sub, "7");
  assert.equal(claims.exp - claims.iat, 60);
  assert.match(claims.jti, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
  assert.equal(mac, createHmac("sha256", secret).update(PLAY_CODE_LABEL + payload).digest("base64url"));
});

test("secret must be long enough or the feature stays off", () => {
  assert.equal(playCodeSecret({ PLAY_CODE_SECRET: secret }), secret);
  assert.equal(playCodeSecret({}), null);
  assert.equal(playCodeSecret({ PLAY_CODE_SECRET: "short" }), null);
});

test("only a well-formed OK answer becomes a login", () => {
  const ok = { result: "PLAY_CODE_RESULT_OK", account_name: "alice", code: "abcdefgh29" };
  assert.deepEqual(playLoginFrom(ok), { name: "alice", code: "abcdefgh29" });
  for (const res of [
    null,
    { ...ok, result: "PLAY_CODE_RESULT_DISABLED" },
    { ...ok, result: "PLAY_CODE_RESULT_BLOCKED" },
    { ...ok, code: "abcdefgh2" }, // short
    { ...ok, code: "abcdefgh20" }, // 0 is not in the alphabet
    { ...ok, code: "abcdefghl2" }, // nor is l
    { ...ok, account_name: "Alice" },
    { ...ok, account_name: "al" },
    { ...ok, account_name: "alice<script>" },
  ]) {
    assert.equal(playLoginFrom(res), null, JSON.stringify(res));
  }
});

test("ticket carries the login only when a code was issued", () => {
  const ticketSecret = "0123456789abcdef0123456789abcdef";
  const claimsOf = (t: string) => JSON.parse(Buffer.from(t.split(".")[0], "base64url").toString());
  const plain = claimsOf(issuePlayTicket(ticketSecret, "7", 1_790_000_000_000, null));
  assert.deepEqual(Object.keys(plain), ["sub", "iat", "exp", "jti"]);
  const withLogin = claimsOf(issuePlayTicket(ticketSecret, "7", 1_790_000_000_000, { name: "alice", code: "abcdefgh29" }));
  assert.deepEqual(Object.keys(withLogin), ["sub", "iat", "exp", "jti", "name", "code"]);
  assert.equal(withLogin.name, "alice");
  assert.equal(withLogin.code, "abcdefgh29");
});
