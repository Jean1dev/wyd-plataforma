import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { defaultGameDirectory, readConfig, writeConfig } from "./config";
import { clientPath, installClient, isClientInstalled } from "./installer";
import { GameProxy } from "./proxy";
import { downloadUpdate, installUpdate, setupUpdater } from "./updater";

let window: BrowserWindow; let game: ChildProcess | undefined; const proxy = new GameProxy();
const isDev = !app.isPackaged;

async function createWindow() {
  window = new BrowserWindow({ width: 960, height: 640, minWidth: 760, minHeight: 500, webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, "preload.js") } });
  if (isDev) await window.loadURL("http://localhost:5173"); else await window.loadFile(path.join(__dirname, "../../dist/index.html"));
  window.on("close", (event) => { if (game && !game.killed) { const result = dialog.showMessageBoxSync(window, { type: "warning", buttons: ["Cancelar", "Fechar"], defaultId: 0, cancelId: 0, message: "O jogo está aberto", detail: "Fechar o launcher interromperá a conexão do jogo. Deseja continuar?" }); if (result === 0) event.preventDefault(); } });
  setupUpdater(window, app.isPackaged);
}

ipcMain.handle("config:get", async () => ({ ...(await readConfig()), suggestedDirectory: defaultGameDirectory() }));
ipcMain.handle("config:set-directory", async (_event, directory: string) => { const config = await readConfig(); config.gameDirectory = directory; await writeConfig(config); return { directory, installed: await isClientInstalled(directory) }; });
ipcMain.handle("config:choose-directory", async () => { const result = await dialog.showOpenDialog(window, { properties: ["openDirectory", "createDirectory"] }); return result.canceled ? undefined : result.filePaths[0]; });
ipcMain.handle("client:inspect", async () => { const config = await readConfig(); return { directory: config.gameDirectory, suggestedDirectory: defaultGameDirectory(), installed: await isClientInstalled(config.gameDirectory) }; });
ipcMain.handle("client:install", async () => { const config = await readConfig(); if (!config.gameDirectory) throw new Error("Escolha a pasta do jogo primeiro."); await installClient(config.gameDirectory, window); return true; });
ipcMain.handle("game:play", async () => { const config = await readConfig(); if (!config.gameDirectory || !(await isClientInstalled(config.gameDirectory))) throw new Error("Client não encontrado. Instale-o novamente."); try { await proxy.start(); game = spawn(clientPath(config.gameDirectory), [], { cwd: config.gameDirectory, windowsHide: false }); game.once("error", async (error) => { await proxy.stop(); window.webContents.send("game-error", { message: error.message }); game = undefined; }); game.once("exit", async () => { await proxy.stop(); game = undefined; window.webContents.send("game-ended"); }); return true; } catch (error) { await proxy.stop(); const e = error as NodeJS.ErrnoException; if (e.code === "EADDRINUSE") throw new Error("A porta 8281 já está em uso, provavelmente por uma regra portproxy. Execute como administrador: netsh interface portproxy delete v4tov4 listenaddress=127.0.0.1 listenport=8281"); throw error; } });
ipcMain.handle("app:close", () => app.quit()); ipcMain.handle("update:download", () => downloadUpdate()); ipcMain.handle("update:install", () => installUpdate());
app.whenReady().then(createWindow); app.on("window-all-closed", () => { void proxy.stop(); if (process.platform !== "darwin") app.quit(); }); app.on("before-quit", () => { void proxy.stop(); });
