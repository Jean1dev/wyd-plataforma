import "server-only";

// Configuration for the internal PIX payment service (a separate Spring Boot
// service). The browser never sees any of this — it is "server-only" and read
// only from Route Handlers.
export type PixConfig = {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  provider: string;
  chavePix: string;
  readTimeoutMs: number;
};

export function pixConfig(): PixConfig {
  return {
    baseUrl: (process.env.PIX_API_URL ?? "").replace(/\/+$/, ""),
    apiKey: process.env.PIX_API_KEY ?? "",
    clientId: process.env.PIX_CLIENT_ID ?? "",
    provider: process.env.PIX_PROVIDER ?? "asaas",
    chavePix: process.env.PIX_CHAVE_PIX ?? "",
    readTimeoutMs: Number(process.env.PIX_READ_TIMEOUT_MS ?? "35000"),
  };
}
