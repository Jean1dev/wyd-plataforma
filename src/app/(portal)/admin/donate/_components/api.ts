"use client";

import type { DonateShopItemPayload } from "@/lib/donate/types";
import { sendAdminRequest as send, type AdminApiError } from "../../_shared/api-client";

export type AdminDonateApiError = AdminApiError;

export function createDonateItem(payload: DonateShopItemPayload) {
  return send("POST", "/api/admin/donate/items", payload) as Promise<{ item_id: string }>;
}

export function updateDonateItem(itemId: string, payload: DonateShopItemPayload) {
  return send("PUT", `/api/admin/donate/items/${encodeURIComponent(itemId)}`, payload) as Promise<{ item_id: string }>;
}

export function setDonateItemEnabled(itemId: string, enabled: boolean) {
  return send("PATCH", `/api/admin/donate/items/${encodeURIComponent(itemId)}/enabled`, { enabled });
}

export function deleteDonateItem(itemId: string) {
  return send("DELETE", `/api/admin/donate/items/${encodeURIComponent(itemId)}`);
}

export function creditDonateBalance(accountId: string, amount: number, reason: string) {
  return send("POST", "/api/admin/donate/credit", { account_id: accountId, amount, reason }) as Promise<{
    new_balance: string;
  }>;
}

export function errorMessage(err: unknown): string {
  const e = err as AdminDonateApiError | undefined;
  if (!e || typeof e !== "object") return "Erro inesperado.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.status === 403 || e.result === "ADMIN_RESULT_FORBIDDEN") return "Você não tem permissão de moderador.";
  if (e.status === 404 || e.result === "ADMIN_RESULT_NOT_FOUND") return "Oferta ou conta não encontrada.";
  if (e.status === 422 || e.result === "ADMIN_RESULT_INVALID") return "Dados inválidos. Revise os campos.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}
