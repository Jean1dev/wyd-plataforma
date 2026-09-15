// Download and install the production client in an isolated temporary folder.
// Never starts the game or modifies the player's configured directory.
const { app } = require("electron");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const archive = path.resolve(process.argv[2] || "dist_electron/win-unpacked/resources/app.asar");

app.whenReady().then(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wyd-install-smoke-"));
  let lastPercent = -1;
  try {
    const { installClient, isClientInstalled } = require(path.join(archive, "dist_electron/electron/installer.js"));
    await installClient(directory, { webContents: { send: (_channel, progress) => {
      const percent = Math.floor(progress.percent / 10) * 10;
      if (progress.phase === "extract" || percent !== lastPercent) {
        console.log(progress.phase, `${percent}%`);
        lastPercent = percent;
      }
    } } });
    if (!(await isClientInstalled(directory))) throw new Error("Installed client is missing wyd.exe");
    const executable = await fs.open(path.join(directory, "wyd.exe"), "r");
    try {
      const header = Buffer.alloc(2);
      await executable.read(header, 0, 2, 0);
      if (header.toString() !== "MZ") throw new Error("Client is not a Windows executable");
    } finally { await executable.close(); }
    console.log("Production client installation passed");
  } finally {
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("wyd-install-smoke-")) {
      throw new Error("Unexpected temporary directory");
    }
    await fs.rm(resolved, { recursive: true, force: true });
  }
  app.exit(0);
}).catch((error) => { console.error(error); app.exit(1); });
