"use client";

import { sendAdminRequest, type AdminApiError } from "../../_shared/api-client";
import type { WorldEventConfigJson, WorldEventGetJson, WorldEventPutJson } from "@/lib/world-events/types";

export type WorldEventApiError = AdminApiError & {
  version?: string;
  config?: WorldEventConfigJson;
};

export async function fetchWorldEventConfig(): Promise<WorldEventGetJson> {
  return (await sendAdminRequest("GET", "/api/admin/world-events")) as WorldEventGetJson;
}

export async function saveWorldEventConfig(body: WorldEventPutJson): Promise<WorldEventGetJson> {
  return (await sendAdminRequest("PUT", "/api/admin/world-events", body)) as WorldEventGetJson;
}

export function worldEventError(err: unknown): WorldEventApiError {
  if (typeof err === "object" && err !== null && "status" in err) {
    return err as WorldEventApiError;
  }
  return { status: 0, error: "unknown" };
}

export function worldEventErrorMessage(err: unknown): string {
  const e = worldEventError(err);
  if (e.status === 401) return "Sessão expirada. Entre novamente.";
  if (e.status === 403) return "Acesso restrito a moderadores.";
  if (e.status === 409) return "A configuração mudou em outra aba. Recarregue antes de salvar.";
  if (e.status === 422) return "Configuração inválida. Revise os campos destacados.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}

