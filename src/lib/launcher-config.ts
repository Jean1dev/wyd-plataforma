export function cleanStorageValue(value: string | undefined): string | undefined {
  return value?.replace(/\uFEFF/g, "").trim() || undefined;
}

export function clientDownloadStatus(error: unknown): 404 | 503 {
  return error instanceof Error && error.name === "NoSuchKey" ? 404 : 503;
}

export function launcherAssetUrl(release: unknown): string {
  const data = release as { draft?: boolean; prerelease?: boolean; assets?: { name: string; browser_download_url: string; size: number }[] };
  if (data?.draft || data?.prerelease) throw new Error("No stable launcher release");
  const asset = data?.assets?.find((item) => /^WYD-Kersef-Launcher-Setup-\d+\.\d+\.\d+\.exe$/.test(item.name) && item.size > 0);
  if (!asset) throw new Error("Launcher installer missing");
  const url = new URL(asset.browser_download_url);
  if (url.origin !== "https://github.com" || !url.pathname.startsWith("/Jean1dev/wyd-plataforma/releases/download/")) throw new Error("Invalid installer URL");
  return url.href;
}
