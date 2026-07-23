"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { EQUIP_SLOT_COUNT } from "@/lib/mob-template/domain";
import type { AdminMobTemplateEquipItem } from "@/lib/mob-template/types";
import { Combobox, type ComboOption } from "../../npcs/_components/Combobox";
import { PickerNote } from "../../npcs/_components/PickerNote";
import { useItemCatalog } from "../../npcs/_components/catalog";
import { errorMessage, SAVE_NOTICE, setMobTemplateEquip } from "./api";

// item_index and the 3 eff/effv pairs keyed by slot; empty item_index means
// "slot vazio". SetMobTemplateEquip replaces the whole Equip[16], so we
// always send every non-empty slot, never a diff.
type SlotFields = { itemIndex: string; eff1: string; effv1: string; eff2: string; effv2: string; eff3: string; effv3: string };
type SlotState = Record<number, SlotFields>;

const EMPTY_SLOT: SlotFields = { itemIndex: "", eff1: "0", effv1: "0", eff2: "0", effv2: "0", eff3: "0", effv3: "0" };

const panel: CSSProperties = {
  background: "var(--grad-panel)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--bevel-raise), var(--shadow-md)",
};

const slotGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
  padding: 8,
  border: "1px solid rgba(95,80,55,0.9)",
  background: "rgba(9,7,4,0.72)",
  boxShadow: "inset 0 0 18px rgba(0,0,0,0.75)",
  maxWidth: 360,
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

function initialSlots(equip: AdminMobTemplateEquipItem[]): SlotState {
  const state: SlotState = {};
  for (const item of equip) {
    state[item.slot] = {
      itemIndex: String(item.item_index),
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

function isFilled(v: SlotFields | undefined): boolean {
  return v != null && v.itemIndex.trim() !== "" && Number(v.itemIndex) > 0;
}

export function EquipEditor({
  templateName,
  overridden,
  equip,
}: {
  templateName: string;
  overridden: boolean;
  equip: AdminMobTemplateEquipItem[];
}) {
  const [slots, setSlots] = useState<SlotState>(() => initialSlots(equip));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const catalog = useItemCatalog();
  const itemOptions: ComboOption[] = useMemo(
    () => catalog.items.map((it) => ({ value: String(it.item_index), label: it.name, hint: `#${it.item_index}` })),
    [catalog.items],
  );
  const itemNameByIndex = useMemo(
    () => new Map(catalog.items.map((it) => [it.item_index, it.name])),
    [catalog.items],
  );

  const filledCount = useMemo(() => Object.values(slots).filter(isFilled).length, [slots]);

  function setSlot(slot: number, patch: Partial<SlotFields>) {
    setSlots((s) => ({ ...s, [slot]: { ...(s[slot] ?? EMPTY_SLOT), ...patch } }));
  }

  function itemLabel(itemValue: string) {
    const itemIndex = Number(itemValue);
    if (!Number.isInteger(itemIndex) || itemIndex <= 0) return "";
    return itemNameByIndex.get(itemIndex) ?? `Item #${itemIndex}`;
  }

  async function save() {
    if (!overridden) return;
    setBusy(true);
    setMsg(null);

    const items: AdminMobTemplateEquipItem[] = [];
    for (const [slotKey, raw] of Object.entries(slots)) {
      if (!isFilled(raw)) continue;
      const item_index = Number(raw.itemIndex.trim());
      if (!Number.isInteger(item_index) || item_index <= 0) {
        setMsg({ kind: "error", text: `Slot ${slotKey}: item_index deve ser inteiro > 0.` });
        setBusy(false);
        return;
      }
      items.push({
        slot: Number(slotKey),
        item_index,
        eff1: Number(raw.eff1) || 0,
        effv1: Number(raw.effv1) || 0,
        eff2: Number(raw.eff2) || 0,
        effv2: Number(raw.effv2) || 0,
        eff3: Number(raw.eff3) || 0,
        effv3: Number(raw.effv3) || 0,
      });
    }

    try {
      await setMobTemplateEquip(templateName, items);
      setMsg({ kind: "ok", text: SAVE_NOTICE });
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const slotList = Array.from({ length: EQUIP_SLOT_COUNT }, (_, i) => i);
  const selected = slots[selectedSlot] ?? EMPTY_SLOT;
  const selectedFilled = isFilled(selected);
  const selectedName = itemLabel(selected.itemIndex);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {!overridden ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--gold-400)" }}>
          Salve os stats do template pelo menos uma vez antes de editar o equipamento (ainda não há
          override salvo para este template).
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
          <div style={slotGrid}>
            {slotList.map((slot) => {
              const s = slots[slot];
              const filled = isFilled(s);
              const active = selectedSlot === slot;
              const name = itemLabel(s?.itemIndex ?? "");
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={active}
                  aria-label={filled ? `Editar slot ${slot}: ${name}` : `Editar slot vazio ${slot}`}
                  title={filled ? `${name} #${s?.itemIndex}` : `Slot ${slot}`}
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    minWidth: 0,
                    padding: 6,
                    borderRadius: "var(--radius-xs)",
                    border: active ? "2px solid var(--gold-400)" : "2px solid #51452f",
                    background: filled
                      ? "radial-gradient(circle at 50% 35%, rgba(236,214,164,0.18), transparent 42%), linear-gradient(145deg, #3a1b0d 0%, #160906 48%, #4b230d 100%)"
                      : "linear-gradient(145deg, #1c0d07 0%, #351708 52%, #100806 100%)",
                    boxShadow: active
                      ? "var(--glow-gold), inset 0 0 12px rgba(0,0,0,0.72)"
                      : "inset 0 0 10px rgba(0,0,0,0.72)",
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
                      <span
                        style={{
                          width: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "var(--font-body)",
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: 1.15,
                          color: "var(--parchment-50)",
                          padding: "0 2px",
                        }}
                      >
                        {name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold-300)" }}>
                        #{s?.itemIndex}
                      </span>
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
              padding: "9px 4px 0",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "var(--parchment-300)",
            }}
          >
            <span>Equip[{EQUIP_SLOT_COUNT}]</span>
            <span>
              {filledCount}/{EQUIP_SLOT_COUNT}
            </span>
          </div>
        </div>

        <div style={{ ...panel, flex: "1 1 360px", minWidth: "min(100%, 300px)", padding: 18 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--parchment-100)", margin: "0 0 4px" }}>
            Slot {selectedSlot}
          </h3>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px" }}>
            {selectedFilled ? selectedName : "Nenhum item neste slot."}
          </p>

          <div style={{ display: "grid", gap: 14 }}>
            <Combobox
              key={selectedSlot}
              label="Item"
              value={selected.itemIndex}
              onChange={(v) => setSlot(selectedSlot, { itemIndex: v })}
              options={itemOptions}
              available={catalog.available}
              loading={catalog.loading}
              placeholder="Buscar item por nome ou índice…"
              manualPlaceholder="item_index"
              manualInputMode="numeric"
              manualHint="Índice no ItemList do jogo (> 0)."
              disabled={!overridden}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {(["eff1", "eff2", "eff3"] as const).map((effKey, i) => {
                const effvKey = (["effv1", "effv2", "effv3"] as const)[i];
                return (
                  <div key={effKey} style={{ display: "grid", gap: 6 }}>
                    <span style={label}>Efeito {i + 1}</span>
                    <input
                      type="number"
                      value={selected[effKey]}
                      onChange={(e) => setSlot(selectedSlot, { [effKey]: e.target.value } as Partial<SlotFields>)}
                      disabled={!overridden}
                      style={inputStyle}
                      placeholder="eff"
                    />
                    <input
                      type="number"
                      value={selected[effvKey]}
                      onChange={(e) => setSlot(selectedSlot, { [effvKey]: e.target.value } as Partial<SlotFields>)}
                      disabled={!overridden}
                      style={inputStyle}
                      placeholder="valor"
                    />
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedFilled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlot(selectedSlot, EMPTY_SLOT)}
                  disabled={!overridden}
                  aria-label={`Limpar slot ${selectedSlot}`}
                  title="Limpar este slot"
                >
                  <X size={15} strokeWidth={2.4} aria-hidden />
                  Limpar slot
                </Button>
              ) : null}
              <Button type="button" onClick={save} disabled={busy || !overridden}>
                Salvar equipamento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
        {filledCount} slot(s) preenchido(s). Salvar substitui o equipamento inteiro — slots vazios ficam
        sem item.
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

export default EquipEditor;
