"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { MERCHANT_TYPES } from "@/lib/npc/domain";
import { CITY_REGION_NAMES, regionFor, regionLabel } from "@/lib/npc/regions";
import type { AdminNpc } from "@/lib/npc/types";
import { errorMessage, PROPAGATION_NOTICE, setVisibility } from "./api";

function merchantLabel(v: number) {
  return MERCHANT_TYPES.find((m) => m.value === v)?.label ?? `#${v}`;
}

// Tab keys that aren't region names. Prefixed so they can never collide with a
// name coming out of Regions.txt.
const ALL_TAB = "__all__";
const NO_REGION_TAB = "__no_region__";

type Tab = { key: string; label: string; count: number };

// The visibility toggle lives in the parent (see NpcAdminTable) so switching
// tabs — which unmounts every row of the previous tab — doesn't snap an already
// toggled NPC back to the value the server rendered.
function Row({
  npc,
  enabled,
  onEnabledChange,
}: {
  npc: AdminNpc;
  enabled: boolean;
  onEnabledChange: (id: string, enabled: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function toggle() {
    const next = !enabled;
    setBusy(true);
    setNotice(null);
    onEnabledChange(npc.id, next); // optimistic
    try {
      await setVisibility(npc.id, next);
      setNotice({ kind: "ok", text: PROPAGATION_NOTICE });
    } catch (err) {
      onEnabledChange(npc.id, !next); // revert
      setNotice({ kind: "error", text: errorMessage(err) });
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Link href={`/admin/npcs/${npc.id}`} style={{ color: "var(--gold-300)", fontWeight: 600 }}>
            {npc.slug}
          </Link>
          {/* Only the rare moderator-created NPC is marked: content-owned is the
              default for ~99% of the base, so badging it would be noise. */}
          {npc.origin === "custom" ? <Badge variant="premium">custom</Badge> : null}
        </span>
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
        {notice ? (
          <div
            aria-live="polite"
            style={{
              color: notice.kind === "ok" ? "var(--emerald-400)" : "var(--danger-400, #d97b7b)",
              fontSize: 11,
              marginTop: 4,
              maxWidth: 260,
            }}
          >
            {notice.text}
          </div>
        ) : null}
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
  // Region comes from pos_x/pos_y, never from map_id — every seeded NPC has
  // map_id 0, so it would collapse the whole list into a single tab.
  const { buckets, tabs } = useMemo(() => {
    const byRegion = new Map<string, AdminNpc[]>();
    for (const npc of npcs) {
      const key = regionFor(npc.pos_x, npc.pos_y) ?? NO_REGION_TAB;
      const bucket = byRegion.get(key);
      if (bucket) bucket.push(npc);
      else byRegion.set(key, [npc]);
    }

    // Cities first (mapzones order), then the remaining regions by size so the
    // busy ones are reachable without scanning the rail, then the leftovers.
    const cities = CITY_REGION_NAMES.filter((name) => byRegion.has(name));
    const rest = [...byRegion.keys()]
      .filter((key) => key !== NO_REGION_TAB && !cities.includes(key as (typeof CITY_REGION_NAMES)[number]))
      .sort((a, b) => (byRegion.get(b)!.length - byRegion.get(a)!.length) || a.localeCompare(b));

    const ordered: Tab[] = [
      { key: ALL_TAB, label: "Todos", count: npcs.length },
      ...[...cities, ...rest].map((key) => ({
        key,
        label: regionLabel(key),
        count: byRegion.get(key)!.length,
      })),
    ];
    if (byRegion.has(NO_REGION_TAB)) {
      ordered.push({
        key: NO_REGION_TAB,
        label: "Fora de região",
        count: byRegion.get(NO_REGION_TAB)!.length,
      });
    }

    return { buckets: byRegion, tabs: ordered };
  }, [npcs]);

  const [tab, setTab] = useState(ALL_TAB);
  // A tab can vanish when the list changes (the last NPC of a region moved
  // away); fall back to "Todos" instead of rendering an empty table.
  const activeTab = tabs.some((t) => t.key === tab) ? tab : ALL_TAB;
  const visible = activeTab === ALL_TAB ? npcs : buckets.get(activeTab) ?? [];

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  function onEnabledChange(id: string, enabled: boolean) {
    setOverrides((prev) => ({ ...prev, [id]: enabled }));
  }

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
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
        {tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                minHeight: 34,
                padding: "6px 10px",
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
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

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
            {visible.map((npc) => (
              <Row
                key={npc.id}
                npc={npc}
                enabled={overrides[npc.id] ?? npc.enabled}
                onEnabledChange={onEnabledChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default NpcAdminTable;
