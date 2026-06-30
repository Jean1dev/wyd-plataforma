"use client";

import { useState } from "react";
import { RankRow, type WydClass } from "@/components/ui";
import { LADDER, RANK_TABS } from "@/lib/portal-data";

type Filter = WydClass | "ALL";

export function RankingsBoard() {
  const [filter, setFilter] = useState<Filter>("ALL");

  const rows = LADDER.filter((r) => filter === "ALL" || r.cls === filter).map((r, i) => ({
    ...r,
    rank: i + 1,
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {RANK_TABS.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: active ? "var(--grad-gold)" : "transparent",
                color: active ? "var(--obsidian-900)" : "var(--text-muted)",
                border: "1px solid " + (active ? "var(--gold-700)" : "var(--iron-400)"),
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: "var(--grad-panel)",
          border: "1px solid var(--iron-400)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--bevel-raise), var(--shadow-md)",
          padding: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "6px 14px 10px",
            borderBottom: "1px solid var(--iron-400)",
            marginBottom: 4,
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          <span style={{ width: 32, textAlign: "center" }}>#</span>
          <span style={{ width: 28 }}>Cl</span>
          <span style={{ flex: 1 }}>Guerreiro</span>
          <span style={{ width: 50 }}>Nível</span>
          <span style={{ width: 70, textAlign: "right" }}>Pontos</span>
        </div>

        {rows.length === 0 ? (
          <div
            style={{
              padding: "28px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            Nenhum guerreiro desta classe no ranking ainda.
          </div>
        ) : (
          rows.map((r) => (
            <RankRow
              key={r.name}
              rank={r.rank}
              name={r.name}
              cls={r.cls}
              level={r.level}
              score={r.score}
              guild={r.guild}
            />
          ))
        )}
      </div>
    </>
  );
}

export default RankingsBoard;
