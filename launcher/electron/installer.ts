import { BrowserWindow } from "electron";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import AdmZip from "adm-zip";
import { CLIENT_DOWNLOAD_URL } from "./config";

export const clientPath = (directory: string) => path.join(directory, "wyd.exe");
export async function isClientInstalled(directory?: string) {
  if (!directory) return false;
  try { return (await fsPromises.stat(clientPath(directory))).isFile(); } catch { return false; }
}

function download(url: string, target: string, win: BrowserWindow): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) return download(response.headers.location, target, win).then(resolve, reject);
      if (response.statusCode !== 200) return reject(new Error(`Download HTTP ${response.statusCode ?? "unknown"}`));
      const total = Number(response.headers["content-length"] ?? 0); let received = 0;
      const output = fs.createWriteStream(target);
      response.on("data", (chunk: Buffer) => { received += chunk.length; win.webContents.send("install-progress", { phase: "download", received, total, percent: total ? Math.round(received * 100 / total) : 0 }); });
      response.pipe(output); output.on("finish", () => output.close(() => resolve())); output.on("error", reject); response.on("error", reject);
    });
    request.on("error", reject);
  });
}

export async function installClient(directory: string, win: BrowserWindow): Promise<void> {
  await fsPromises.mkdir(directory, { recursive: true });
  const temporary = await fsPromises.mkdtemp(path.join(os.tmpdir(), "wyd-client-"));
  const zipPath = path.join(temporary, "client.zip"); const extracted = path.join(temporary, "extracted");
  try {
    await download(CLIENT_DOWNLOAD_URL, zipPath, win);
    await fsPromises.mkdir(extracted, { recursive: true });
    win.webContents.send("install-progress", { phase: "extract", percent: 0 });
    new AdmZip(zipPath).extractAllTo(extracted, true);
    win.webContents.send("install-progress", { phase: "extract", percent: 100 });
    const entries = await fsPromises.readdir(extracted);
    for (const entry of entries) await fsPromises.rename(path.join(extracted, entry), path.join(directory, entry));
    if (!(await isClientInstalled(directory))) throw new Error("O pacote não contém wyd.exe na raiz.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOSPC") throw new Error("Não há espaço em disco suficiente para instalar o client.");
    throw error;
  } finally { await fsPromises.rm(temporary, { recursive: true, force: true }).catch(() => undefined); }
}
