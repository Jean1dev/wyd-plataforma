"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Input } from "@/components/ui";
import type { DonateShopItem, DonateShopItemPayload } from "@/lib/donate/types";
import { parseDonateInt as num } from "@/lib/donate/format";
import { Combobox, type ComboOption } from "../../npcs/_components/Combobox";
import { PickerNote } from "../../npcs/_components/PickerNote";
import { useItemCatalog } from "../../npcs/_components/catalog";
import { createDonateItem, errorMessage, updateDonateItem } from "./api";

const emptyItem: DonateShopItemPayload = {
  item_index: 0,
  eff1: 0,
  effv1: 0,
  eff2: 0,
  effv2: 0,
  eff3: 0,
  effv3: 0,
  price: 1,
  title: "",
  description: "",
  enabled: true,
  expires_days: 0,
};

const textareaStyle: React.CSSProperties = {
  minHeight: 86,
  resize: "vertical",
  padding: "9px 11px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

const legendStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

export function DonateItemForm({
  item,
  onDone,
}: {
  item?: DonateShopItem;
  onDone?: () => void;
}) {
  const router = useRouter();
  const editing = Boolean(item);
  const catalog = useItemCatalog();
  const options: ComboOption[] = useMemo(
    () => catalog.items.map((it) => ({ value: String(it.item_index), label: it.name, hint: String(it.item_index) })),
    [catalog.items],
  );

  const [form, setForm] = useState<DonateShopItemPayload>(item ?? emptyItem);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof DonateShopItemPayload>(key: K, value: DonateShopItemPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (editing && item) {
        await updateDonateItem(item.id, form);
        setMsg({ kind: "ok", text: "Oferta atualizada." });
      } else {
        await createDonateItem(form);
        setForm(emptyItem);
        setMsg({ kind: "ok", text: "Oferta criada." });
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(120px,180px)", gap: 12 }}>
        <Input
          label="Título"
          name="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
        <Input
          label="Preço"
          name="price"
          type="number"
          min={1}
          value={form.price}
          onChange={(e) => set("price", num(e.target.value))}
          required
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <Combobox
          label="Item"
          value={String(form.item_index || "")}
          onChange={(v) => set("item_index", num(v))}
          options={options}
          available={catalog.available}
          loading={catalog.loading}
          placeholder="Buscar item..."
          manualPlaceholder="item_index"
          manualHint="Use o índice do ItemList.csv."
          manualInputMode="numeric"
        />
        <PickerNote
          status={catalog.status}
          rpc="ListItemCatalog"
          contentDependent
          manualHint="Digite o item_index manualmente a partir do ItemList.csv."
        />
      </div>

      <label style={field}>
        <span style={legendStyle}>Descrição</span>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} style={textareaStyle} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 12 }}>
        <Input label="Efeito 1" type="number" value={form.eff1} onChange={(e) => set("eff1", num(e.target.value))} />
        <Input label="Valor 1" type="number" value={form.effv1} onChange={(e) => set("effv1", num(e.target.value))} />
        <Input
          label="Expira em dias"
          type="number"
          min={0}
          value={form.expires_days}
          onChange={(e) => set("expires_days", num(e.target.value))}
        />
        <Input label="Efeito 2" type="number" value={form.eff2} onChange={(e) => set("eff2", num(e.target.value))} />
        <Input label="Valor 2" type="number" value={form.effv2} onChange={(e) => set("effv2", num(e.target.value))} />
        <div />
        <Input label="Efeito 3" type="number" value={form.eff3} onChange={(e) => set("eff3", num(e.target.value))} />
        <Input label="Valor 3" type="number" value={form.effv3} onChange={(e) => set("effv3", num(e.target.value))} />
        <Checkbox label="Habilitada na vitrine" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
      </div>

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

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando..." : editing ? "Salvar oferta" : "Criar oferta"}
        </Button>
        {editing ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
