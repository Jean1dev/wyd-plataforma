import { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

export function setupUpdater(win: BrowserWindow, isPackaged: boolean) {
  if (!isPackaged) return;
  autoUpdater.autoDownload = false;
  autoUpdater.on("update-available", (info) => win.webContents.send("update-available", { version: info.version }));
  autoUpdater.on("download-progress", (info) => win.webContents.send("update-progress", { percent: info.percent, transferred: info.transferred, total: info.total }));
  autoUpdater.on("update-downloaded", (info) => win.webContents.send("update-downloaded", { version: info.version }));
  autoUpdater.on("error", (error) => win.webContents.send("update-error", { message: error.message }));
  void autoUpdater.checkForUpdates().catch(() => undefined);
}

export const downloadUpdate = () => autoUpdater.downloadUpdate();
export const installUpdate = () => autoUpdater.quitAndInstall(false, true);
