"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { MERCHANT_TYPES } from "@/lib/npc/domain";
import type { AdminNpc } from "@/lib/npc/types";
import { errorMessage, setVisibility } from "./api";

function merchantLabel(v: number) {
  return MERCHANT_TYPES.find((m) => m.value === v)?.label ?? `#${v}`;
}

function Row({ npc }: { npc: AdminNpc }) {
  const [enabled, setEnabled] = useState(npc.enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    setError(null);
    setEnabled(next); // optimistic
    try {
      await setVisibility(npc.id, next);
    } catch (err) {
      setEnabled(!next); // revert
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

  return (
    <tr>
      <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{npc.id}</td>
      <td style={cell}>
        <Link href={`/admin/npcs/${npc.id}`} style={{ color: "var(--gold-300)", fontWeight: 600 }}>
          {npc.slug}
        </Link>
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{npc.display_name}</div>
      </td>
      <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>
        {npc.map_id} · {npc.pos_x},{npc.pos_y}
      </td>
      <td style={cell}>{merchantLabel(npc.merchant)}</td>
      <td style={cell}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: busy ? "wait" : "pointer" }}>
          <input type="checkbox" checked={enabled} disabled={busy} onChange={toggle} style={{ accentColor: "var(--gold-600)", width: 16, height: 16 }} />
          {enabled ? <Badge variant="gold">Visível</Badge> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Oculto</span>}
        </label>
        {error ? <div style={{ color: "var(--danger-400, #d97b7b)", fontSize: 11, marginTop: 4 }}>{error}</div> : null}
      </td>
      <td style={{ ...cell, textAlign: "right" }}>
        <Button href={`/admin/npcs/${npc.id}`} size="sm" variant="ghost">
          Editar
        </Button>
      </td>
    </tr>
  );
}

export function NpcAdminTable({ npcs }: { npcs: AdminNpc[] }) {
  if (npcs.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        Nenhum NPC cadastrado. Rode o seed <code>dbserver import-npcs</code> ou crie um novo.
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
    <div style={{ overflowX: "auto", background: "var(--grad-panel)", border: "1px solid var(--iron-400)", borderRadius: "var(--radius-lg)", boxShadow: "var(--bevel-raise), var(--shadow-md)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Slug / Nome</th>
            <th style={th}>Mapa · X,Y</th>
            <th style={th}>Tipo</th>
            <th style={th}>Visibilidade</th>
            <th style={{ ...th, textAlign: "right" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {npcs.map((npc) => (
            <Row key={npc.id} npc={npc} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NpcAdminTable;
