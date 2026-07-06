"use client";

import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { Combobox, type ComboOption } from "./Combobox";
import { PickerNote } from "./PickerNote";
import { useItemCatalog } from "./catalog";
import { errorMessage, PROPAGATION_NOTICE, setItemPrice } from "./api";

// Global per-item price. There is no per-NPC price. Sending a negative price
// clears the override so the item falls back to the game catalog price.
export function PriceEditor() {
  const [itemIndex, setItemIndex] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const catalog = useItemCatalog();
  const itemOptions: ComboOption[] = useMemo(
    () => catalog.items.map((it) => ({ value: String(it.item_index), label: it.name, hint: `#${it.item_index}` })),
    [catalog.items],
  );

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
      <div style={{ display: "grid", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Item
        </span>
        <Combobox
          value={itemIndex}
          onChange={setItemIndex}
          options={itemOptions}
          available={catalog.available}
          loading={catalog.loading}
          placeholder="Buscar item por nome…"
          manualPlaceholder="item_index (ex. 1024)"
          manualInputMode="numeric"
          manualHint="Índice no ItemList do jogo (> 0)."
        />
        {!catalog.loading ? (
          <PickerNote
            status={catalog.status}
            rpc="ListItemCatalog"
            contentDependent
            manualHint="Digite o item_index manualmente (índice do ItemList.csv, > 0)."
          />
        ) : null}
      </div>

      <Input
        label="Preço (global)"
        name="price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="ex. 50000"
      />

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
