import { NextResponse } from "next/server";
import { rankingRpc } from "@/lib/web-api/ranking-client";

function intParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = intParam(url.searchParams.get("limit"), 50);
  const offset = intParam(url.searchParams.get("offset"), 0);

  let resp;
  try {
    resp = await rankingRpc("ListExpRanking", { limit, offset });
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  return NextResponse.json({
    entries: resp.entries.map((entry) => ({
      rank: entry.rank,
      name: entry.name,
      class: entry.class,
      clan: entry.clan,
      guildId: entry.guild_id,
      level: entry.level,
      exp: String(entry.exp),
      classMaster: entry.class_master,
    })),
    totalCount: resp.total_count,
  });
}
