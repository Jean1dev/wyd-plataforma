"use client";

// Thin client helpers over the BFF admin routes. The browser never talks gRPC;
// these hit our own same-origin REST routes which derive moderator_id from the
// session cookie.

import { sendAdminRequest as send, type AdminApiError } from "../../_shared/api-client";
import type { AdminMobTemplateEquipItem, AdminMobTemplateStat } from "@/lib/mob-template/types";

export type { AdminApiError };

export type StatPayload = Omit<AdminMobTemplateStat, "template_name" | "overridden" | "equip">;

export function updateMobTemplateStat(templateName: string, payload: StatPayload) {
  return send("PUT", `/api/admin/mob-templates/${encodeURIComponent(templateName)}`, payload);
}

export function deleteMobTemplateStat(templateName: string) {
  return send("DELETE", `/api/admin/mob-templates/${encodeURIComponent(templateName)}`);
}

export function setMobTemplateEquip(templateName: string, items: AdminMobTemplateEquipItem[]) {
  return send("PUT", `/api/admin/mob-templates/${encodeURIComponent(templateName)}/equip`, { items });
}

export function errorMessage(err: unknown): string {
  const e = err as AdminApiError | undefined;
  if (!e || typeof e !== "object") return "Erro inesperado.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.status === 403 || e.result === "ADMIN_RESULT_FORBIDDEN") return "Você não tem permissão de moderador.";
  if (e.status === 404 || e.result === "ADMIN_RESULT_NOT_FOUND") {
    return "Template não encontrado. Salve os stats pelo menos uma vez antes de editar o equipamento.";
  }
  if (e.status === 422 || e.result === "ADMIN_RESULT_INVALID") return "Dados inválidos. Revise os campos.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}

// Shown after any successful mutation: unlike other admin tools, mob template
// stats never hot-reload — they only take effect on the game server's next
// restart (tmServer with -mob-stat-editing).
export const SAVE_NOTICE = "Salvo. A alteração só aparece no jogo após o próximo restart do servidor.";
