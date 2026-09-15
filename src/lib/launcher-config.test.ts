import assert from "node:assert/strict";
import test from "node:test";
import { cleanStorageValue, clientDownloadStatus, launcherAssetUrl } from "./launcher-config";

test("storage configuration accepts BOM and surrounding whitespace", () => {
  assert.equal(cleanStorageValue("\uFEFFauto\r\n"), "auto");
  assert.equal(cleanStorageValue(" \uFEFF "), undefined);
  assert.equal(cleanStorageValue(undefined), undefined);
});

test("only a missing client object is a 404", () => {
  assert.equal(clientDownloadStatus(Object.assign(new Error(), { name: "NoSuchKey" })), 404);
  for (const name of ["AccessDenied", "InvalidRegion", "NoSuchBucket", "TimeoutError"]) {
    assert.equal(clientDownloadStatus(Object.assign(new Error(), { name })), 503);
  }
});

test("release download selects executable, excluding update metadata", () => {
  const url = "https://github.com/Jean1dev/wyd-plataforma/releases/download/v1.0.3/WYD-Kersef-Launcher-Setup-1.0.3.exe";
  const asset = { name: "WYD-Kersef-Launcher-Setup-1.0.3.exe", browser_download_url: url, size: 123 };
  assert.equal(launcherAssetUrl({ assets: [{ ...asset, name: asset.name + ".blockmap" }, asset] }), url);
  for (const release of [{ assets: [] }, { prerelease: true, assets: [asset] }, { assets: [{ ...asset, size: 0 }] }, { assets: [{ ...asset, browser_download_url: "https://example.com/file.exe" }] }]) {
    assert.throws(() => launcherAssetUrl(release));
  }
});
