import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getClientObject } from "@/lib/launcher-storage";

export async function GET() {
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
    console.error("launcher client download", error);
    return NextResponse.json({ error: "client_not_found" }, { status: 404 });
  }
}
