const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

// Exercise the packaged HTML, assets and preload with the same file:// loading
// used by the installed launcher, without changing the user's game settings.
const archive = path.resolve(process.argv[2] || "dist_electron/win-unpacked/resources/app.asar");
const failures = [];
const timeout = setTimeout(() => {
  console.error("Timed out loading packaged launcher", failures);
  app.exit(1);
}, 20000);

app.whenReady().then(async () => {
  ipcMain.handle("client:inspect", () => ({ installed: false }));
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(archive, "dist_electron/electron/preload.js"),
    },
  });
  win.webContents.session.webRequest.onErrorOccurred((details) => {
    failures.push(`${details.url}: ${details.error}`);
  });
  try {
    await win.loadFile(path.join(archive, "dist/index.html"));
    const result = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const poll = () => {
        const root = document.querySelector('#root');
        if (root?.innerText.includes('Escolher pasta')) {
          resolve({ text: root.innerText, bridge: typeof window.launcher?.inspect,
            styled: [...document.styleSheets].some(sheet => sheet.href && sheet.cssRules.length > 0) });
        } else if (Date.now() > deadline) reject(new Error('Launcher interface did not render'));
        else setTimeout(poll, 50);
      };
      poll();
    })`);
    if (failures.length || result.bridge !== "function" || !result.styled) {
      throw new Error(JSON.stringify({ failures, result }));
    }
    console.log("Packaged launcher smoke test passed:", JSON.stringify(result));
    clearTimeout(timeout);
    app.exit(0);
  } catch (error) {
    console.error(error, failures);
    clearTimeout(timeout);
    app.exit(1);
  }
}).catch((error) => { console.error(error); app.exit(1); });
