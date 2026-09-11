import { NextResponse } from "next/server";
import { assertSameOrigin, requireModerator } from "@/lib/auth/require-moderator";
import { uploadClientObject } from "@/lib/launcher-storage";
import { Readable } from "node:stream";

async function authorize() {
  const originError = await assertSameOrigin();
  if (originError) return originError;
  const guard = await requireModerator();
  return guard.ok ? null : guard.response;
}

export async function PUT(request: Request) {
  const denied = await authorize();
  if (denied) return denied;
  const size = Number(request.headers.get("content-length") ?? 0);
  const contentType = request.headers.get("content-type") ?? "";
  if (!request.body || !contentType.toLowerCase().startsWith("application/zip")) return NextResponse.json({ error: "zip_required" }, { status: 400 });
  if (size > 2 * 1024 * 1024 * 1024) return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  try {
    await uploadClientObject(Readable.fromWeb(request.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>), size || undefined);
    return NextResponse.json({ ok: true, key: "launcher/client/latest.zip" });
  } catch (error) {
    console.error("launcher upload", error);
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
