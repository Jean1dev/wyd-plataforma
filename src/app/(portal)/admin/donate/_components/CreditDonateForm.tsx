"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { formatDonate, parseDonateInt as num } from "@/lib/donate/format";
import { creditDonateBalance, errorMessage } from "./api";

export function CreditDonateForm() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await creditDonateBalance(accountId, amount, reason);
      setMsg({ kind: "ok", text: `Crédito aplicado. Novo saldo: ${formatDonate(res.new_balance)}.` });
      setAmount(1);
      setReason("");
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: 14,
        background: "var(--grad-panel)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--bevel-raise), var(--shadow-md)",
        padding: 18,
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--parchment-100)", margin: 0 }}>
        Crédito manual
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,1fr) minmax(120px,1fr)", gap: 12 }}>
        <Input
          label="Account ID"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value.trim())}
          inputMode="numeric"
          required
        />
        <Input
          label="Amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(num(e.target.value))}
          required
        />
      </div>
      <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex. pagamento manual" />
      {msg ? (
        <div
          style={{
            color: msg.kind === "ok" ? "var(--emerald-400)" : "var(--danger-400, #d97b7b)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        >
          {msg.text}
        </div>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Creditando..." : "Creditar donate"}
      </Button>
    </form>
  );
}
