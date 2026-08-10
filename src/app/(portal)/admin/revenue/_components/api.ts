"use client";

import type {
  AccountsJson,
  DonateLedgerJson,
  RevenueSummaryJson,
  TopBuyersJson,
  TopupOrdersJson,
} from "@/lib/revenue/http-types";

// Everything the panel reads is a GET, so it goes straight through fetch with
// cache: "no-store" (same as DropTool) rather than through sendAdminRequest,
// which exists for the mutating admin routes.

export type LoadStatus = "idle" | "loading" | "ok" | "forbidden" | "invalid" | "upstream" | "error";

export type LoadState<T> = { status: LoadStatus; data: T | null };

export class RevenueRequestError extends Error {
  readonly status: LoadStatus;

  constructor(status: LoadStatus) {
    super(status);
    this.name = "RevenueRequestError";
    this.status = status;
  }
}

export function statusFor(httpStatus: number): LoadStatus {
  if (httpStatus === 403 || httpStatus === 401) return "forbidden";
  if (httpStatus === 422 || httpStatus === 400) return "invalid";
  if (httpStatus === 502) return "upstream";
  return "error";
}

export type QueryValues = Record<string, string | number | undefined>;

export function buildUrl(path: string, values: QueryValues): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    const text = String(value).trim();
    if (text !== "") params.set(key, text);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new RevenueRequestError("upstream");
  }

  if (!res.ok) throw new RevenueRequestError(statusFor(res.status));

  return (await res.json()) as T;
}

export type SummaryParams = { from?: string; to?: string; bucket?: string; accountId?: string };

export function fetchSummary(params: SummaryParams, signal?: AbortSignal): Promise<RevenueSummaryJson> {
  return get<RevenueSummaryJson>(buildUrl("/api/admin/revenue/summary", params), signal);
}

export type OrdersParams = SummaryParams & {
  status?: string;
  method?: string;
  limit?: number;
  offset?: number;
};

export function fetchOrders(params: OrdersParams, signal?: AbortSignal): Promise<TopupOrdersJson> {
  return get<TopupOrdersJson>(buildUrl("/api/admin/revenue/orders", params), signal);
}

export type TopBuyersParams = { from?: string; to?: string; limit?: number; offset?: number };

export function fetchTopBuyers(params: TopBuyersParams, signal?: AbortSignal): Promise<TopBuyersJson> {
  return get<TopBuyersJson>(buildUrl("/api/admin/revenue/top-buyers", params), signal);
}

export type LedgerParams = { from?: string; to?: string; action?: string; accountId?: string; limit?: number; offset?: number };

export function fetchDonateLedger(params: LedgerParams, signal?: AbortSignal): Promise<DonateLedgerJson> {
  return get<DonateLedgerJson>(buildUrl("/api/admin/revenue/donate-ledger", params), signal);
}

export function searchAccounts(q: string, signal?: AbortSignal): Promise<AccountsJson> {
  return get<AccountsJson>(buildUrl("/api/admin/revenue/accounts", { q }), signal);
}

const MESSAGES: Record<LoadStatus, string> = {
  idle: "",
  loading: "",
  ok: "",
  forbidden: "Você não tem permissão de moderador. Faça login novamente se a sessão expirou.",
  invalid: "Período inválido. Verifique se a data inicial vem antes da final e se a janela tem no máximo 366 dias.",
  upstream: "web-api indisponível. Tente novamente em instantes.",
  error: "Não foi possível carregar os dados.",
};

export function errorMessage(status: LoadStatus): string {
  return MESSAGES[status] || "Erro inesperado.";
}
