import { connection, NextResponse } from "next/server";
import { launcherAssetUrl } from "@/lib/launcher-config";

export async function GET() {
  await connection();
  try {
    const response = await fetch("https://api.github.com/repos/Jean1dev/wyd-plataforma/releases/latest", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Release unavailable");
    return NextResponse.redirect(launcherAssetUrl(await response.json()), { status: 302, headers: { "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Download indisponível</title><h1>Download temporariamente indisponível</h1><p>Tente novamente em instantes.</p><a href="/api/launcher/download">Tentar novamente</a> · <a href="/download">Voltar</a></html>', {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "60" },
    });
  }
}
