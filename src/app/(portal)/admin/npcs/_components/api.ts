"use client";

// Thin client helpers over the BFF admin routes. The browser never talks gRPC;
// these hit our own same-origin REST routes which derive moderator_id from the
// session cookie.

export type AdminApiError = { status: number; result?: string; error?: string };

async function send(method: string, url: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: AdminApiError = { status: res.status, ...(data as object) };
    throw err;
  }
  return data;
}

export function setVisibility(npcId: string, enabled: boolean) {
  return send("PATCH", `/api/admin/npcs/${encodeURIComponent(npcId)}/visibility`, { enabled });
}

export function deleteNpc(npcId: string) {
  return send("DELETE", `/api/admin/npcs/${encodeURIComponent(npcId)}`);
}

export type UpsertPayload = {
  slug: string;
  template_name: string;
  display_name: string;
  enabled: boolean;
  map_id: number;
  pos_x: number;
  pos_y: number;
  route_type: number;
  merchant: number;
};

export function createNpc(payload: UpsertPayload) {
  return send("POST", `/api/admin/npcs`, payload) as Promise<{ npc_id: string }>;
}

export function updateNpc(npcId: string, payload: UpsertPayload) {
  return send("PUT", `/api/admin/npcs/${encodeURIComponent(npcId)}`, payload) as Promise<{ npc_id: string }>;
}

export type ShopItemPayload = {
  slot: number;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
  quantity: number;
};

export function setShop(npcId: string, items: ShopItemPayload[]) {
  return send("PUT", `/api/admin/npcs/${encodeURIComponent(npcId)}/shop`, { items });
}

export function setItemPrice(itemIndex: number, price: number) {
  return send("PUT", `/api/admin/items/${encodeURIComponent(itemIndex)}/price`, { price });
}

export function errorMessage(err: unknown): string {
  const e = err as AdminApiError | undefined;
  if (!e || typeof e !== "object") return "Erro inesperado.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.status === 403 || e.result === "ADMIN_RESULT_FORBIDDEN") return "Você não tem permissão de moderador.";
  if (e.status === 404 || e.result === "ADMIN_RESULT_NOT_FOUND") return "NPC não encontrado.";
  if (e.status === 422 || e.result === "ADMIN_RESULT_INVALID") return "Dados inválidos. Revise os campos.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a operação.";
}

// Shown after any successful mutation: the game reflects changes on the
// tmServer's periodic reload (~15s), not instantly.
export const PROPAGATION_NOTICE =
  "Salvo. A alteração aparece no jogo em alguns segundos (recarga do servidor).";
