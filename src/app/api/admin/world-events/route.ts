import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { httpForAdminResult, upstreamError } from "@/lib/web-api/admin-http";
import { worldEventAdminRpc } from "@/lib/web-api/world-event-admin-client";
import {
  parseWorldEventPutBody,
  protoToWorldEventConfig,
  worldEventConfigToProto,
} from "@/lib/world-events/validation";

function nextVersion(version: string): string {
  try {
    return String(BigInt(version) + BigInt(1));
  } catch {
    return version;
  }
}

export async function GET() {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;

  let resp;
  try {
    resp = await worldEventAdminRpc("GetWorldEventConfig", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  const status = httpForAdminResult(resp.result);
  if (status !== 200) return NextResponse.json({ result: resp.result }, { status });

  return NextResponse.json({
    version: String(resp.version ?? "0"),
    config: protoToWorldEventConfig(resp.config),
  });
}

export async function PUT(req: Request) {
  const guard = await requireModerator();
  if (!guard.ok) return guard.response;
  const bad = await assertSameOrigin();
  if (bad) return bad;

  const parsed = parseWorldEventPutBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  let current;
  try {
    current = await worldEventAdminRpc("GetWorldEventConfig", { moderator_id: guard.moderatorId });
  } catch {
    return upstreamError();
  }

  const currentStatus = httpForAdminResult(current.result);
  if (currentStatus !== 200) return NextResponse.json({ result: current.result }, { status: currentStatus });

  const currentVersion = String(current.version ?? "0");
  if (currentVersion !== parsed.value.version) {
    return NextResponse.json(
      {
        error: "version_conflict",
        version: currentVersion,
        config: protoToWorldEventConfig(current.config),
      },
      { status: 409 },
    );
  }

  let saved;
  try {
    saved = await worldEventAdminRpc("SetWorldEventConfig", {
      moderator_id: guard.moderatorId,
      config: worldEventConfigToProto(parsed.value.config),
    });
  } catch {
    return upstreamError();
  }

  const savedStatus = httpForAdminResult(saved.result);
  if (savedStatus !== 200) return NextResponse.json({ result: saved.result }, { status: savedStatus });

  return NextResponse.json({
    version: nextVersion(currentVersion),
    config: parsed.value.config,
  });
}
