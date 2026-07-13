"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Props = {
  itemId: string;
  disabled: boolean;
  onClaimed: (itemId: string) => void;
};

type ApiError = { status: number; result?: string; error?: string };

function messageFor(err: unknown): string {
  const e = err as ApiError | undefined;
  if (!e || typeof e !== "object") return "Não foi possível concluir o resgate.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.result === "CLAIM_RESULT_ALREADY_CLAIMED") return "Você já resgatou sua recompensa de hoje.";
  if (e.status === 404 || e.result === "CLAIM_RESULT_NOT_FOUND") return "Oferta não encontrada.";
  if (e.status === 409 || e.result === "CLAIM_RESULT_DISABLED") return "Oferta indisponível. Recarregue a página.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir o resgate.";
}

export function ClaimRewardButton({ itemId, disabled, onClaimed }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/daily-reward/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reward_item_id: itemId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw { status: res.status, ...(data as object) };

      onClaimed(itemId);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Button type="button" size="sm" variant="ghost" disabled={busy || disabled} onClick={claim}>
        {busy ? "Resgatando..." : "Resgatar"}
      </Button>
      {error ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--danger-400, #d97b7b)",
            lineHeight: 1.35,
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
