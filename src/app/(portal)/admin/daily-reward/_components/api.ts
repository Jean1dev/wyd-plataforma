"use client";

import type { DailyRewardItemPayload } from "@/lib/daily-reward/types";
import { sendAdminRequest as send, type AdminApiError } from "../../_shared/api-client";

export type AdminRewardApiError = AdminApiError;

export function createRewardItem(payload: DailyRewardItemPayload) {
  return send("POST", "/api/admin/daily-reward/items", payload) as Promise<{ item_id: string }>;
}

export function updateRewardItem(itemId: string, payload: DailyRewardItemPayload) {
  return send("PUT", `/api/admin/daily-reward/items/${encodeURIComponent(itemId)}`, payload) as Promise<{
    item_id: string;
  }>;
}

export function setRewardItemEnabled(itemId: string, enabled: boolean) {
  return send("PATCH", `/api/admin/daily-reward/items/${encodeURIComponent(itemId)}/enabled`, { enabled });
}

export function deleteRewardItem(itemId: string) {
  return send("DELETE", `/api/admin/daily-reward/items/${encodeURIComponent(itemId)}`);
}

export function errorMessage(err: unknown): string {
  const e = err as AdminRewardApiError | undefined;
  if (!e || typeof e !== "object") return "Erro inesperado.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.status === 403 || e.result === "ADMIN_RESULT_FORBIDDEN") return "Você não tem permissão de moderador.";
  if (e.status === 404 || e.result === "ADMIN_RESULT_NOT_FOUND") return "Oferta não encontrada.";
  if (e.status === 422 || e.result === "ADMIN_RESULT_INVALID") return "Dados inválidos. Revise os campos.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}
