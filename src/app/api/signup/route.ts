import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rpc } from "@/lib/web-api/client";

type SignupBody = {
  name?: unknown;
  password?: unknown;
  email?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SignupBody | null;
  const name = text(body?.name).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  const email = text(body?.email);

  let res;
  try {
    res = await rpc("CreateAccount", { name, password, email });
  } catch {
    return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  }

  switch (res.result) {
    case "CREATE_RESULT_OK": {
      const session = await getSession();
      session.accountId = res.account_id;
      session.name = name;
      session.isLoggedIn = true;
      await session.save();
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    case "CREATE_RESULT_NAME_TAKEN":
      return NextResponse.json({ error: "name_taken" }, { status: 409 });
    default:
      return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  }
}
