"use client";

import { useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { Combobox, type ComboOption } from "./Combobox";
import { PickerNote } from "./PickerNote";
import { useItemCatalog } from "./catalog";
import { usePriceOverrides } from "./prices";
import { errorMessage, PROPAGATION_NOTICE, setItemPrice } from "./api";

// Global per-item price. There is no per-NPC price. Sending a negative price
// clears the override so the item falls back to the game catalog price.
export function PriceEditor() {
  const [itemIndex, setItemIndex] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const catalog = useItemCatalog();
  const overrides = usePriceOverrides();
  const itemOptions: ComboOption[] = useMemo(
    () => catalog.items.map((it) => ({ value: String(it.item_index), label: it.name, hint: `#${it.item_index}` })),
    [catalog.items],
  );
  const itemNames = useMemo(
    () => new Map(catalog.items.map((it) => [it.item_index, it.name])),
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
      overrides.refresh();
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function clearOverride(idx: number) {
    setBusy(true);
    setMsg(null);
    try {
      await setItemPrice(idx, -1);
      setMsg({ kind: "ok", text: "Override removido. " + PROPAGATION_NOTICE });
      overrides.refresh();
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 28, maxWidth: 640 }}>
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

      <div style={{ display: "grid", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Overrides atuais
        </span>

        {!overrides.loading && overrides.status === "empty" ? (
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
            Nenhum override ativo — todos os itens usam o preço do catálogo.
          </div>
        ) : null}

        {!overrides.loading && overrides.status === "unavailable" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "8px 11px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--gold-700)",
              background: "rgba(200,163,91,0.10)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--gold-200, #e6d3a3)",
            }}
          >
            Não foi possível carregar os overrides de preço: o web-api não respondeu ListItemPrices
            (serviço fora do ar ou RPC ainda não disponível).
          </div>
        ) : null}

        {overrides.available ? (
          <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "var(--font-body)", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "6px 8px", fontWeight: 400 }}>Item</th>
                <th style={{ padding: "6px 8px", fontWeight: 400 }}>Preço</th>
                <th style={{ padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {overrides.prices.map((p) => (
                <tr key={p.item_index} style={{ borderTop: "1px solid var(--border-subtle, #333)" }}>
                  <td style={{ padding: "6px 8px" }}>
                    {itemNames.has(p.item_index) ? (
                      <>
                        {itemNames.get(p.item_index)}{" "}
                        <span style={{ color: "var(--text-muted)" }}>#{p.item_index}</span>
                      </>
                    ) : (
                      `#${p.item_index}`
                    )}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{p.price}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => clearOverride(p.item_index)}
                      disabled={busy}
                    >
                      Limpar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

export default PriceEditor;
