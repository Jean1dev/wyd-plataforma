import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { donateTopupRpc } from "@/lib/web-api/donate-topup-client";
import { normalizeCpf } from "@/lib/donate/cpf";

// Reads the account's payer profile so the top-up modal can pre-fill (and skip
// the form when it already exists).
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let resp;
  try {
    resp = await donateTopupRpc("GetPayerProfile", { account_id: session.accountId });
  } catch {
    return upstreamError();
  }

  return NextResponse.json({
    found: resp.found,
    name: resp.found ? resp.name : "",
    cpf: resp.found ? resp.cpf : "",
  });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const cpf = normalizeCpf(body?.cpf);
  if (!name) {
    return NextResponse.json({ error: "name_invalid" }, { status: 422 });
  }
  if (!cpf) {
    return NextResponse.json({ error: "cpf_invalid" }, { status: 422 });
  }

  let resp;
  try {
    resp = await donateTopupRpc("SavePayerProfile", { account_id: session.accountId, name, cpf });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });
  return NextResponse.json({ ok: true, name, cpf });
}
