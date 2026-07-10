"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { merchantHasShop, SHOP_TABS } from "@/lib/npc/domain";
import type { AdminNpc, AdminNpcShopItem } from "@/lib/npc/types";
import { Combobox, type ComboOption } from "./Combobox";
import { PickerNote } from "./PickerNote";
import { useItemCatalog } from "./catalog";
import { errorMessage, PROPAGATION_NOTICE, setShop, type ShopItemPayload } from "./api";

// item_index keyed by slot; 0/empty means "slot vazio". SetNpcShop replaces the
// entire shop, so we always send every non-empty slot.
type SlotState = Record<number, string>;

function initialSlots(shop: AdminNpcShopItem[]): SlotState {
  const state: SlotState = {};
  for (const item of shop) {
    state[item.slot] = String(item.item_index);
  }
  return state;
}

export function ShopEditor({ npc }: { npc: AdminNpc }) {
  const [slots, setSlots] = useState<SlotState>(() => initialSlots(npc.shop));
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const catalog = useItemCatalog();
  const itemOptions: ComboOption[] = useMemo(
    () => catalog.items.map((it) => ({ value: String(it.item_index), label: it.name, hint: `#${it.item_index}` })),
    [catalog.items],
  );

  const canSell = merchantHasShop(npc.merchant);

  const filledCount = useMemo(
    () => Object.values(slots).filter((v) => v.trim() !== "" && Number(v) > 0).length,
    [slots],
  );

  function setSlot(slot: number, value: string) {
    setSlots((s) => ({ ...s, [slot]: value }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);

    const items: ShopItemPayload[] = [];
    for (const [slotKey, raw] of Object.entries(slots)) {
      const value = raw.trim();
      if (value === "") continue;
      const item_index = Number(value);
      if (!Number.isInteger(item_index) || item_index <= 0) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: item_index deve ser inteiro > 0.` });
        setBusy(false);
        return;
      }
      items.push({ slot: Number(slotKey), item_index, eff1: 0, effv1: 0, eff2: 0, effv2: 0, eff3: 0, effv3: 0 });
    }

    try {
      await setShop(npc.id, items);
      setMsg({ kind: "ok", text: PROPAGATION_NOTICE });
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const current = SHOP_TABS[tab];
  const slotList: number[] = [];
  for (let s = current.from; s <= current.to; s++) slotList.push(s);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!canSell ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>
          Este tipo de NPC ({npc.merchant}) normalmente não vende itens. A loja só faz sentido para lojas
          (tipo 1 ou 19).
        </div>
      ) : null}

      {!catalog.loading ? (
        <PickerNote
          status={catalog.status}
          rpc="ListItemCatalog"
          contentDependent
          manualHint="Digite o item_index manualmente em cada slot (índice do ItemList.csv, > 0)."
        />
      ) : null}

      <div style={{ display: "flex", gap: 6 }}>
        {SHOP_TABS.map((t) => {
          const active = t.index === tab;
          return (
            <button
              key={t.index}
              type="button"
              onClick={() => setTab(t.index)}
              style={{
                padding: "7px 16px",
                borderRadius: "var(--radius-sm)",
                border: active ? "1px solid var(--gold-600)" : "1px solid var(--iron-400)",
                background: active ? "rgba(200,163,91,0.14)" : "transparent",
                color: active ? "var(--gold-300)" : "var(--text-muted)",
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {t.label} ({t.from}–{t.to})
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {slotList.map((slot) => {
          const filled = (slots[slot] ?? "").trim() !== "" && Number(slots[slot]) > 0;
          return (
            <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--text-muted)" }}>
                Slot {slot}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Combobox
                    compact
                    value={slots[slot] ?? ""}
                    onChange={(v) => setSlot(slot, v)}
                    options={itemOptions}
                    available={catalog.available}
                    loading={catalog.loading}
                    placeholder="Buscar item…"
                    manualPlaceholder="vazio"
                    manualInputMode="numeric"
                  />
                </div>
                {filled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSlot(slot, "")}
                    aria-label={`Remover item do slot ${slot}`}
                    title="Remover item deste slot"
                  >
                    ×
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
        {filledCount} item(s) na loja. Clique em &ldquo;×&rdquo; para remover um item do slot. Salvar
        substitui a loja inteira — slots vazios ficam sem item.
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

      <div>
        <Button type="button" onClick={save} disabled={busy}>
          Salvar loja
        </Button>
      </div>
    </div>
  );
}

export default ShopEditor;
