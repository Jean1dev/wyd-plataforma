import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { characterRpc } from "@/lib/web-api/character-client";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let resp;
  try {
    resp = await characterRpc("ListMyCharacters", { account_id: session.accountId });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  return NextResponse.json({ characters: resp.characters ?? [] });
}
