import { contextBridge, ipcRenderer } from "electron";

const api = {
  getConfig: () => ipcRenderer.invoke("config:get"),
  chooseDirectory: () => ipcRenderer.invoke("config:choose-directory"),
  setDirectory: (directory: string) => ipcRenderer.invoke("config:set-directory", directory),
  inspect: () => ipcRenderer.invoke("client:inspect"),
  install: () => ipcRenderer.invoke("client:install"),
  play: () => ipcRenderer.invoke("game:play"),
  close: () => ipcRenderer.invoke("app:close"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  on: (event: string, listener: (...args: unknown[]) => void) => { const wrapped = (_e: Electron.IpcRendererEvent, value: unknown) => listener(value); ipcRenderer.on(event, wrapped); return () => ipcRenderer.removeListener(event, wrapped); },
};
contextBridge.exposeInMainWorld("launcher", api);

export type LauncherApi = typeof api;
