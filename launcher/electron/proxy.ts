import net from "node:net";
import { LOCAL_HOST, LOCAL_PORT, SERVER_HOST, SERVER_PORT } from "./config";

export class GameProxy {
  private server?: net.Server;
  get active() { return Boolean(this.server); }

  async start(): Promise<void> {
    if (this.server) return;
    await new Promise<void>((resolve, reject) => {
      const probe = net.createConnection({ host: SERVER_HOST, port: SERVER_PORT });
      const fail = (error: Error) => { probe.destroy(); reject(new Error(`Servidor indisponível: ${error.message}`)); };
      probe.setTimeout(4000, () => fail(new Error("tempo esgotado")));
      probe.once("connect", () => { probe.end(); resolve(); });
      probe.once("error", fail);
    });
    const server = net.createServer((client) => {
      const upstream = net.createConnection({ host: SERVER_HOST, port: SERVER_PORT });
      client.pipe(upstream); upstream.pipe(client);
      const close = () => { client.destroy(); upstream.destroy(); };
      client.once("error", close); upstream.once("error", close);
    });
    await new Promise<void>((resolve, reject) => {
      const onError = (error: NodeJS.ErrnoException) => { server.removeListener("listening", onListen); reject(error); };
      const onListen = () => { server.removeListener("error", onError); resolve(); };
      server.once("error", onError); server.once("listening", onListen); server.listen(LOCAL_PORT, LOCAL_HOST);
    });
    this.server = server;
  }

  async stop(): Promise<void> {
    const server = this.server; this.server = undefined;
    if (!server) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
