import "server-only";

import { pixConfig } from "./config";

export type CriarPaymentLinkStripeInput = {
  quantity: number;
  priceId: string;
  externalReferenceId: string;
};

export type CriarPaymentLinkStripeOutput = {
  url?: string;
  id?: string;
};

export class StripePaymentLinkApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripePaymentLinkApiError";
  }
}

export async function criarPaymentLinkStripe(
  input: CriarPaymentLinkStripeInput,
): Promise<CriarPaymentLinkStripeOutput> {
  const cfg = pixConfig();
  if (!cfg.baseUrl) throw new StripePaymentLinkApiError("PIX_API_URL not configured");

  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/stripe/payment-link`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-KEY": cfg.apiKey,
        "client-id": cfg.clientId,
      },
      body: JSON.stringify({
        quantity: input.quantity,
        priceId: input.priceId,
        externalReferenceId: input.externalReferenceId,
      }),
      signal: AbortSignal.timeout(cfg.readTimeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new StripePaymentLinkApiError(`Stripe payment link request failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    throw new StripePaymentLinkApiError(`Stripe payment link responded ${res.status}`);
  }

  return (await res.json().catch(() => ({}))) as CriarPaymentLinkStripeOutput;
}
