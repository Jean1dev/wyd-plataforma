"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { formatDonate } from "@/lib/donate/format";

type Props = {
  itemId: string;
  onBalance: (balance: string) => void;
};

type ApiError = { status: number; result?: string; error?: string };

function messageFor(err: unknown): string {
  const e = err as ApiError | undefined;
  if (!e || typeof e !== "object") return "Não foi possível concluir a compra.";
  if (e.status === 401) return "Sessão expirada. Faça login novamente.";
  if (e.status === 402 || e.result === "BUY_RESULT_INSUFFICIENT_FUNDS") return "Saldo insuficiente.";
  if (e.status === 404 || e.result === "BUY_RESULT_NOT_FOUND") return "Oferta não encontrada.";
  if (e.status === 409 || e.result === "BUY_RESULT_DISABLED") return "Oferta indisponível. Recarregue a loja.";
  if (e.status === 502) return "web-api indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir a compra.";
}

export function BuyOfferButton({ itemId, onBalance }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function buy() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/donate/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shop_item_id: itemId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw { status: res.status, ...(data as object) };

      const nextBalance = String((data as { new_balance?: unknown }).new_balance ?? "0");
      onBalance(nextBalance);
      setMsg({
        kind: "ok",
        text: `Compra concluída. Saldo: ${formatDonate(nextBalance)}. Item será entregue no seu armazém no próximo login.`,
      });
    } catch (err) {
      setMsg({ kind: "error", text: messageFor(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={buy}>
        {busy ? "Comprando..." : "Comprar"}
      </Button>
      {msg ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: msg.kind === "ok" ? "var(--emerald-400)" : "var(--danger-400, #d97b7b)",
            lineHeight: 1.35,
          }}
        >
          {msg.text}
        </div>
      ) : null}
    </div>
  );
}
