"use client";

// Shared fetch wrapper for BFF admin routes. The browser never talks gRPC;
// these hit our own same-origin REST routes which derive moderator_id from
// the session cookie.

export type AdminApiError = { status: number; result?: string; error?: string };

export async function sendAdminRequest(method: string, url: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...(data as object) } satisfies AdminApiError;
  return data;
}
