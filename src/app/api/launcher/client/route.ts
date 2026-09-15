import { connection, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getClientObject } from "@/lib/launcher-storage";
import { clientDownloadStatus } from "@/lib/launcher-config";

export async function GET() {
  await connection();
  try {
    const object = await getClientObject();
    if (!object.Body) return NextResponse.json({ error: "client_not_found" }, { status: 404 });
    const body = Readable.toWeb(object.Body as Readable) as unknown as BodyInit;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": object.ContentType ?? "application/zip",
        ...(object.ContentLength != null ? { "Content-Length": String(object.ContentLength) } : {}),
        "Content-Disposition": 'attachment; filename="wyd-client.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = clientDownloadStatus(error);
    console.error("launcher client download", { status, name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: status === 404 ? "client_not_found" : "client_unavailable" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
