import "server-only";

import { pixConfig } from "./config";

// Thin REST adapter over the internal PIX payment service. The service speaks
// HTTP (not gRPC), so this does not follow the `rpc()` client pattern used for
// web-api — but it keeps the same "one thin module per service" spirit. Mirrors
// the `DefaultPixApi` adapter documented by the payment service.

export type CriarCobrancaInput = {
  valorCents: number;
  devedorNome: string;
  devedorCPF: string;
  descricaoSolicitacao: string;
  externalReference: string;
};

export type CriarCobrancaOutput = {
  txId?: string;
  qrCode?: string;
  chave?: string;
  pixCopiaECola?: string;
};

// Rejects on any non-2xx or transport failure; callers map that to HTTP 502,
// matching how gRPC rejections are handled elsewhere in the BFF.
export class PixApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PixApiError";
  }
}

export async function criarCobrancaPix(input: CriarCobrancaInput): Promise<CriarCobrancaOutput> {
  const cfg = pixConfig();
  if (!cfg.baseUrl) throw new PixApiError("PIX_API_URL not configured");

  // The upstream contract expects a decimal amount (e.g. 5.00), not cents.
  const valor = Number((input.valorCents / 100).toFixed(2));

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/pix/criar-cobranca`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-KEY": cfg.apiKey,
        "client-id": cfg.clientId,
        "X-PIX-PROVIDER": cfg.provider,
      },
      body: JSON.stringify({
        chavePix: cfg.chavePix,
        valor,
        devedorNome: input.devedorNome,
        devedorCPF: input.devedorCPF,
        descricaoSolicitacao: input.descricaoSolicitacao,
        externalReference: input.externalReference,
      }),
      signal: AbortSignal.timeout(cfg.readTimeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new PixApiError(`PIX request failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    throw new PixApiError(`PIX responded ${res.status}`);
  }

  return (await res.json().catch(() => ({}))) as CriarCobrancaOutput;
}
