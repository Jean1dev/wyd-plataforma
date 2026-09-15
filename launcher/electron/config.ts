import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

export const SERVER_HOST = "66.33.22.224";
export const SERVER_PORT = 56950;
export const LOCAL_HOST = "127.0.0.1";
export const LOCAL_PORT = 8281;
// Packaged launchers always use the public portal; overrides are development-only.
export const CLIENT_DOWNLOAD_URL = app.isPackaged
  ? "https://wyd-ten.vercel.app/api/launcher/client"
  : process.env.WYD_CLIENT_DOWNLOAD_URL?.trim() || "https://wyd-ten.vercel.app/api/launcher/client";

export type LauncherConfig = { gameDirectory?: string };
export function defaultGameDirectory() { return path.join(app.getPath("documents"), "WYD Kersef"); }

function configPath() { return path.join(app.getPath("userData"), "config.json"); }

export async function readConfig(): Promise<LauncherConfig> {
  try { return JSON.parse(await fs.readFile(configPath(), "utf8")) as LauncherConfig; }
  catch { return {}; }
}

export async function writeConfig(config: LauncherConfig): Promise<void> {
  const file = configPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(config, null, 2), "utf8");
}
