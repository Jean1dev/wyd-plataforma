"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { formatDonate } from "@/lib/donate/format";
import type { DonateShopItem } from "@/lib/donate/types";
import { deleteDonateItem, errorMessage, setDonateItemEnabled } from "./api";
import { DonateItemForm } from "./DonateItemForm";

function Row({ item }: { item: DonateShopItem }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(item.enabled);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    setError(null);
    setEnabled(next);
    try {
      await setDonateItemEnabled(item.id, next);
      router.refresh();
    } catch (err) {
      setEnabled(!next);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Excluir oferta "${item.title}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDonateItem(item.id);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const cell: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--iron-500, #2a2620)",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--text-body)",
    verticalAlign: "middle",
  };

  if (editing) {
    return (
      <tr>
        <td colSpan={7} style={{ ...cell, padding: 16 }}>
          <DonateItemForm item={item} onDone={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{item.id}</td>
      <td style={cell}>
        <div style={{ color: "var(--gold-300)", fontWeight: 700 }}>{item.title}</div>
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.description || "Sem descrição"}</div>
      </td>
      <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>#{item.item_index}</td>
      <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--gold-300)" }}>
        {formatDonate(item.price)}
      </td>
      <td style={cell}>{item.expires_days > 0 ? `${item.expires_days} dias` : "Permanente"}</td>
      <td style={cell}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: busy ? "wait" : "pointer" }}>
          <input
            type="checkbox"
            checked={enabled}
            disabled={busy}
            onChange={toggle}
            style={{ accentColor: "var(--gold-600)", width: 16, height: 16 }}
          />
          {enabled ? <Badge variant="gold">Na vitrine</Badge> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Oculta</span>}
        </label>
        {error ? <div style={{ color: "var(--danger-400, #d97b7b)", fontSize: 11, marginTop: 4 }}>{error}</div> : null}
      </td>
      <td style={{ ...cell, textAlign: "right" }}>
        <div style={{ display: "inline-flex", gap: 8 }}>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={busy}>
            Editar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}>
            Excluir
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function DonateItemsTable({ items }: { items: DonateShopItem[] }) {
  if (items.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        Nenhuma oferta cadastrada. Crie a primeira oferta abaixo.
      </p>
    );
  }

  const th: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 12px",
    fontFamily: "var(--font-ui)",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--iron-400)",
  };

  return (
    <div
      style={{
        overflowX: "auto",
        background: "var(--grad-panel)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--bevel-raise), var(--shadow-md)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Oferta</th>
            <th style={th}>Item</th>
            <th style={th}>Preço</th>
            <th style={th}>Duração</th>
            <th style={th}>Status</th>
            <th style={{ ...th, textAlign: "right" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
