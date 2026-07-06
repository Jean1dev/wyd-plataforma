"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { errorMessage, PROPAGATION_NOTICE, setItemPrice } from "./api";

// Global per-item price. There is no per-NPC price. Sending a negative price
// clears the override so the item falls back to the game catalog price.
export function PriceEditor() {
  const [itemIndex, setItemIndex] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(clear: boolean) {
    const idx = Number(itemIndex);
    if (!Number.isInteger(idx) || idx <= 0) {
      setMsg({ kind: "error", text: "item_index deve ser inteiro > 0." });
      return;
    }
    const value = clear ? -1 : Number(price);
    if (!clear && (!Number.isInteger(value) || value < 0)) {
      setMsg({ kind: "error", text: "Preço deve ser inteiro >= 0." });
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      await setItemPrice(idx, value);
      setMsg({
        kind: "ok",
        text: clear ? "Override removido. " + PROPAGATION_NOTICE : PROPAGATION_NOTICE,
      });
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 480 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input
          label="Item index"
          name="item_index"
          type="number"
          value={itemIndex}
          onChange={(e) => setItemIndex(e.target.value)}
          placeholder="ex. 1024"
        />
        <Input
          label="Preço (global)"
          name="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="ex. 50000"
        />
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
        O preço vale em <strong>todos</strong> os NPCs que vendem este item. Limpar override devolve o item ao
        preço do catálogo.
      </div>

      {msg ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: msg.kind === "ok" ? "var(--emerald-400)" : "var(--danger-400, #d97b7b)",
          }}
        >
          {msg.text}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <Button type="button" onClick={() => submit(false)} disabled={busy}>
          Definir preço
        </Button>
        <Button type="button" variant="ghost" onClick={() => submit(true)} disabled={busy}>
          Limpar override
        </Button>
      </div>
    </div>
  );
}

export default PriceEditor;
