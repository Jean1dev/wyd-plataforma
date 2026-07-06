import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rpc } from "@/lib/web-api/client";

type LoginBody = {
  name?: unknown;
  password?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;
  const name = text(body?.name).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";

  let res;
  try {
    res = await rpc("VerifyCredentials", { name, password });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  if (res.blocked) {
    return NextResponse.json({ error: "blocked" }, { status: 403 });
  }

  const session = await getSession();
  session.accountId = res.account_id;
  session.name = name;
  session.isLoggedIn = true;
  session.role = res.role;
  await session.save();

  return NextResponse.json({ ok: true });
}
