import { connection, NextResponse } from "next/server";
import { getClientDownloadUrl } from "@/lib/launcher-storage";
import { clientDownloadStatus } from "@/lib/launcher-config";

export async function GET() {
  await connection();
  try {
    return NextResponse.redirect(await getClientDownloadUrl(), { status: 302, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = clientDownloadStatus(error);
    console.error("launcher client download", {
      status,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      httpStatusCode: (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode,
    });
    return NextResponse.json({ error: status === 404 ? "client_not_found" : "client_unavailable" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
