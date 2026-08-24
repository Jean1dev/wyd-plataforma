"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button, ItemIcon } from "@/components/ui";
import { merchantHasShop, SHOP_TABS } from "@/lib/npc/domain";
import { normalizeShopQuantity, parsePositiveInt32, parseUint8 } from "@/lib/npc/validation";
import { toItemIconData } from "@/lib/item-catalog/view";
import type { AdminNpc, AdminNpcShopItem } from "@/lib/npc/types";
import { Combobox, type ComboOption } from "./Combobox";
import { PickerNote } from "./PickerNote";
import { useItemCatalog } from "./catalog";
import { errorMessage, PROPAGATION_NOTICE, setShop, type ShopItemPayload } from "./api";

type EffectField = "eff1" | "effv1" | "eff2" | "effv2" | "eff3" | "effv3";
type SlotEntry = { itemIndex: string; quantity: string } & Record<EffectField, string>;

// SetNpcShop replaces the entire shop, so state includes every field that must
// survive a round-trip. Empty itemIndex means "slot vazio".
type SlotState = Record<number, SlotEntry>;

const EFFECT_PAIRS = [
  { effect: "eff1", value: "effv1", label: "Efeito 1" },
  { effect: "eff2", value: "effv2", label: "Efeito 2" },
  { effect: "eff3", value: "effv3", label: "Efeito 3" },
] as const;

function emptySlot(): SlotEntry {
  return {
    itemIndex: "",
    quantity: "1",
    eff1: "0",
    effv1: "0",
    eff2: "0",
    effv2: "0",
    eff3: "0",
    effv3: "0",
  };
}

const panel: CSSProperties = {
  background: "var(--grad-panel)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--bevel-raise), var(--shadow-md)",
};

const shopFrame: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  padding: 10,
  borderRadius: "var(--radius-md)",
  border: "2px solid #5d513c",
  background:
    "linear-gradient(180deg, #e4d9bd 0%, #b9a886 7%, #2a2419 8%, #15100b 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.8), var(--shadow-lg)",
};

const shopTitle: CSSProperties = {
  height: 34,
  margin: "0 20px 10px",
  border: "1px solid #6b5940",
  borderRadius: "0 0 var(--radius-md) var(--radius-md)",
  background:
    "linear-gradient(180deg, rgba(125,41,20,0.95) 0%, rgba(72,20,12,0.96) 52%, rgba(28,14,9,0.98) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,230,180,0.24), 0 2px 5px rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  color: "var(--parchment-50)",
  textShadow: "0 1px 3px #000",
};

const tabRail: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 5,
  marginBottom: 10,
};

const slotGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  padding: 8,
  border: "1px solid rgba(95,80,55,0.9)",
  background: "rgba(9,7,4,0.72)",
  boxShadow: "inset 0 0 18px rgba(0,0,0,0.75)",
};

const label: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

function initialSlots(shop: AdminNpcShopItem[]): SlotState {
  const state: SlotState = {};
  for (const item of shop) {
    state[item.slot] = {
      itemIndex: String(item.item_index),
      quantity: String(item.quantity || 1),
      eff1: String(item.eff1),
      effv1: String(item.effv1),
      eff2: String(item.eff2),
      effv2: String(item.effv2),
      eff3: String(item.eff3),
      effv3: String(item.effv3),
    };
  }
  return state;
}

export function ShopEditor({ npc }: { npc: AdminNpc }) {
  const [slots, setSlots] = useState<SlotState>(() => initialSlots(npc.shop));
  const [tab, setTab] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const catalog = useItemCatalog();
  const itemOptions: ComboOption[] = useMemo(
    () =>
      catalog.items.map((it) => ({
        value: String(it.item_index),
        label: it.display_name || it.name,
        hint: `#${it.item_index}`,
        keywords: it.name,
        leading: (
          <ItemIcon
            item={toItemIconData(it)}
            itemIndex={it.item_index}
            iconPackVersion={catalog.iconPackVersion}
            size="sm"
          />
        ),
      })),
    [catalog.items, catalog.iconPackVersion],
  );

  const canSell = merchantHasShop(npc.merchant);

  const filledCount = useMemo(
    () => Object.values(slots).filter((v) => v.itemIndex.trim() !== "" && Number(v.itemIndex) > 0).length,
    [slots],
  );

  function filledInRange(from: number, to: number) {
    let count = 0;
    for (let slot = from; slot <= to; slot++) {
      const itemValue = slots[slot]?.itemIndex ?? "";
      if (itemValue.trim() !== "" && Number(itemValue) > 0) count++;
    }
    return count;
  }

  function setSlot(slot: number, patch: Partial<SlotEntry>) {
    setSlots((s) => ({
      ...s,
      [slot]: {
        ...(s[slot] ?? emptySlot()),
        ...patch,
      },
    }));
  }

  function setSlotItem(slot: number, itemIndex: string) {
    setSlots((state) => {
      const previous = state[slot] ?? emptySlot();
      if (previous.itemIndex === itemIndex) return state;
      return {
        ...state,
        [slot]: {
          ...previous,
          itemIndex,
          eff1: "0",
          effv1: "0",
          eff2: "0",
          effv2: "0",
          eff3: "0",
          effv3: "0",
        },
      };
    });
  }

  function selectTab(nextTab: number) {
    const next = SHOP_TABS[nextTab];
    setTab(nextTab);
    if (selectedSlot < next.from || selectedSlot > next.to) {
      setSelectedSlot(next.from);
    }
  }

  function itemLabel(itemValue: string) {
    const itemIndex = Number(itemValue);
    if (!Number.isInteger(itemIndex) || itemIndex <= 0) return "";
    const entry = catalog.byIndex.get(itemIndex);
    return entry ? entry.display_name || entry.name : `Item #${itemIndex}`;
  }

  /** Icon data for a slot's raw value, or undefined when the catalog can't resolve it. */
  function itemIcon(itemValue: string) {
    const entry = catalog.byIndex.get(Number(itemValue));
    return entry ? toItemIconData(entry) : undefined;
  }

  async function save() {
    setBusy(true);
    setMsg(null);

    const items: ShopItemPayload[] = [];
    for (const [slotKey, raw] of Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b))) {
      const value = raw.itemIndex.trim();
      if (value === "") continue;
      const item_index = parsePositiveInt32(value);
      if (item_index == null) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: item_index deve estar entre 1 e 2147483647.` });
        setBusy(false);
        return;
      }
      const quantity = normalizeShopQuantity(raw.quantity);
      if (quantity == null) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: quantity deve ser 0 ou inteiro entre 1 e 255.` });
        setBusy(false);
        return;
      }

      const effects = Object.fromEntries(
        EFFECT_PAIRS.flatMap(({ effect, value: effectValue }) => [
          [effect, parseUint8(raw[effect])],
          [effectValue, parseUint8(raw[effectValue])],
        ]),
      ) as Record<EffectField, number | null>;
      if (Object.values(effects).some((effect) => effect == null)) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: efeitos devem ser inteiros entre 0 e 255.` });
        setBusy(false);
        return;
      }
      if (effects.eff1 === 61 || effects.eff2 === 61 || effects.eff3 === 61) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: não use o efeito 61; ajuste a quantidade.` });
        setBusy(false);
        return;
      }
      items.push({
        slot: Number(slotKey),
        item_index,
        eff1: effects.eff1!,
        effv1: effects.effv1!,
        eff2: effects.eff2!,
        effv2: effects.effv2!,
        eff3: effects.eff3!,
        effv3: effects.effv3!,
        quantity,
      });
    }

    try {
      await setShop(npc.id, items);
      // Reflect server normalization locally (notably quantity 0/blank -> 1).
      setSlots(initialSlots(items));
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
  const selected = slots[selectedSlot] ?? emptySlot();
  const selectedFilled = selected.itemIndex.trim() !== "" && Number(selected.itemIndex) > 0;
  const selectedName = itemLabel(selected.itemIndex);

  return (
    <div style={{ display: "grid", gap: 16 }}>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: "0 1 360px", minWidth: "min(100%, 280px)" }}>
          <div style={shopFrame}>
            <div style={shopTitle}>Loja</div>

            <div style={tabRail}>
              {SHOP_TABS.map((t) => {
                const active = t.index === tab;
                return (
                  <button
                    key={t.index}
                    type="button"
                    onClick={() => selectTab(t.index)}
                    style={{
                      minHeight: 34,
                      padding: "6px 8px",
                      borderRadius: "var(--radius-xs)",
                      border: active ? "1px solid var(--gold-600)" : "1px solid rgba(93,81,60,0.95)",
                      background: active
                        ? "linear-gradient(180deg, rgba(202,165,92,0.32), rgba(90,58,23,0.46))"
                        : "linear-gradient(180deg, rgba(37,30,20,0.9), rgba(14,10,6,0.92))",
                      color: active ? "var(--gold-300)" : "var(--parchment-300)",
                      boxShadow: active ? "inset 0 1px 0 rgba(255,230,170,0.22)" : "none",
                      fontFamily: "var(--font-ui)",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {t.index + 1} ({filledInRange(t.from, t.to)})
                  </button>
                );
              })}
            </div>

            <div style={slotGrid}>
              {slotList.map((slot) => {
                const itemValue = slots[slot]?.itemIndex ?? "";
                const quantity = slots[slot]?.quantity ?? "1";
                const filled = itemValue.trim() !== "" && Number(itemValue) > 0;
                const active = selectedSlot === slot;
                const name = itemLabel(itemValue);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={active}
                    aria-label={filled ? `Editar slot ${slot}: ${name}` : `Editar slot vazio ${slot}`}
                    title={filled ? `${name} #${itemValue}` : `Slot ${slot}`}
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      minWidth: 0,
                      padding: 6,
                      borderRadius: "var(--radius-xs)",
                      border: active ? "2px solid var(--gold-400)" : "2px solid #51452f",
                      background: filled
                        ? "radial-gradient(circle at 50% 35%, rgba(236,214,164,0.18), transparent 42%), linear-gradient(145deg, #3a1b0d 0%, #160906 48%, #4b230d 100%)"
                        : "radial-gradient(circle at 50% 50%, rgba(93,52,19,0.34) 0 18%, transparent 19%), radial-gradient(circle at 50% 50%, transparent 0 33%, rgba(99,51,20,0.25) 34% 42%, transparent 43%), linear-gradient(145deg, #1c0d07 0%, #351708 52%, #100806 100%)",
                      boxShadow: active
                        ? "var(--glow-gold), inset 0 0 12px rgba(0,0,0,0.72)"
                        : "inset 0 0 10px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,230,170,0.08)",
                      color: "var(--parchment-100)",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: filled ? "center" : "flex-start",
                      gap: 2,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 5,
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: active ? "var(--gold-300)" : "rgba(200,176,131,0.72)",
                      }}
                    >
                      {slot}
                    </span>

                    {filled ? (
                      <>
                        <ItemIcon
                          item={itemIcon(itemValue)}
                          itemIndex={Number(itemValue)}
                          iconPackVersion={catalog.iconPackVersion}
                          size="md"
                        />
                        <span
                          style={{
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 600,
                            lineHeight: 1.15,
                            color: "var(--parchment-50)",
                            padding: "0 2px",
                          }}
                        >
                          {name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--gold-300)",
                            lineHeight: 1.2,
                          }}
                        >
                          #{itemValue}
                        </span>
                        {Number(quantity) > 1 ? (
                          <span
                            style={{
                              position: "absolute",
                              right: 4,
                              bottom: 4,
                              minWidth: 20,
                              maxWidth: "70%",
                              padding: "2px 4px",
                              borderRadius: "var(--radius-xs)",
                              background: "rgba(10,8,5,0.82)",
                              border: "1px solid rgba(236,214,164,0.32)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                              color: "var(--parchment-50)",
                              lineHeight: 1,
                            }}
                          >
                            x{quantity}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span
                        style={{
                          marginTop: "auto",
                          marginBottom: "auto",
                          fontFamily: "var(--font-ui)",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(200,176,131,0.52)",
                        }}
                      >
                        Vazio
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "9px 4px 0",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--parchment-300)",
              }}
            >
              <span>
                Aba {current.index + 1}: slots {current.from}-{current.to}
              </span>
              <span>{filledCount}/27</span>
            </div>
          </div>
        </div>

        <div style={{ ...panel, flex: "1 1 360px", minWidth: "min(100%, 300px)", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
            <div>
              <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
                Slot selecionado
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  color: "var(--parchment-100)",
                  margin: 0,
                }}
              >
                Slot {selectedSlot}
              </h3>
            </div>
            <div
              style={{
                padding: "5px 9px",
                borderRadius: "var(--radius-sm)",
                border: selectedFilled ? "1px solid var(--gold-700)" : "1px solid var(--iron-400)",
                background: selectedFilled ? "rgba(200,163,91,0.12)" : "rgba(10,8,5,0.35)",
                color: selectedFilled ? "var(--gold-300)" : "var(--text-muted)",
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFilled ? "Preenchido" : "Vazio"}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "72px minmax(0, 1fr)",
              gap: 14,
              alignItems: "center",
              marginTop: 18,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: "var(--radius-xs)",
                border: "2px solid #51452f",
                background: selectedFilled
                  ? "radial-gradient(circle at 50% 35%, rgba(236,214,164,0.18), transparent 42%), linear-gradient(145deg, #3a1b0d 0%, #160906 48%, #4b230d 100%)"
                  : "linear-gradient(145deg, #1c0d07 0%, #351708 52%, #100806 100%)",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.72)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                overflow: "hidden",
                color: selectedFilled ? "var(--gold-300)" : "rgba(200,176,131,0.5)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              {selectedFilled ? (
                <>
                  <ItemIcon
                    item={itemIcon(selected.itemIndex)}
                    itemIndex={Number(selected.itemIndex)}
                    iconPackVersion={catalog.iconPackVersion}
                    size="md"
                  />
                  <span>#{selected.itemIndex}</span>
                </>
              ) : (
                <span style={{ fontSize: 13 }}>{selectedSlot}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  color: selectedFilled ? "var(--parchment-100)" : "var(--text-muted)",
                }}
              >
                {selectedFilled ? selectedName : "Nenhum item neste slot"}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Clique em outro espaço da loja para editar o slot correspondente.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <Combobox
              key={selectedSlot}
              label="Item"
              value={selected.itemIndex}
              onChange={(v) => setSlotItem(selectedSlot, v)}
              options={itemOptions}
              available={catalog.available}
              loading={catalog.loading}
              placeholder="Buscar item por nome ou índice…"
              manualPlaceholder="item_index"
              manualInputMode="numeric"
              manualHint="Índice no ItemList do jogo (> 0)."
            />

            <label style={{ display: "grid", gap: 6 }}>
              <span style={label}>Quantidade</span>
              <input
                type="number"
                min={0}
                max={255}
                value={selected.quantity}
                onChange={(e) => setSlot(selectedSlot, { quantity: e.target.value })}
                placeholder="Qtd"
                style={inputStyle}
              />
            </label>

            {selectedFilled ? (
              <details>
                <summary style={{ ...label, cursor: "pointer", color: "var(--gold-300)" }}>
                  Efeitos opcionais
                </summary>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {EFFECT_PAIRS.map(({ effect, value: effectValue, label: effectLabel }) => (
                    <div key={effect} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={label}>{effectLabel}</span>
                        <input
                          type="number"
                          value={selected[effect]}
                          onChange={(e) => setSlot(selectedSlot, { [effect]: e.target.value })}
                          style={inputStyle}
                        />
                      </label>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={label}>Valor {effectLabel.slice(-1)}</span>
                        <input
                          type="number"
                          value={selected[effectValue]}
                          onChange={(e) => setSlot(selectedSlot, { [effectValue]: e.target.value })}
                          style={inputStyle}
                        />
                      </label>
                    </div>
                  ))}
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
                    Não use o efeito 61 (EF_AMOUNT): packs são definidos somente pela quantidade.
                  </span>
                </div>
              </details>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedFilled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlots((state) => ({ ...state, [selectedSlot]: emptySlot() }))}
                  aria-label={`Limpar slot ${selectedSlot}`}
                  title="Limpar este slot"
                >
                  <X size={15} strokeWidth={2.4} aria-hidden />
                  Limpar slot
                </Button>
              ) : null}
              <Button type="button" onClick={save} disabled={busy}>
                Salvar loja
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
        {filledCount} item(s) na loja. Salvar substitui a loja inteira — slots vazios ficam sem item.
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
    </div>
  );
}

export default ShopEditor;
