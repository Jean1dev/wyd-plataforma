"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePointJson } from "@/lib/revenue/http-types";
import { centsToReais, formatBucketLabel, formatCents, formatCount, formatCredits } from "@/lib/revenue/format";

export type BucketId = "day" | "week" | "month";

const BUCKETS: { id: BucketId; label: string }[] = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

type Row = {
  label: string;
  reais: number;
  grossCents: string;
  paidOrders: string;
  creditsSold: string;
  distinctBuyers: string;
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div
      style={{
        background: "var(--surface-inset, #1b1813)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-md)",
        padding: "10px 12px",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        color: "var(--text-body)",
        lineHeight: 1.6,
      }}
    >
      <div style={{ fontFamily: "var(--font-ui)", color: "var(--text-muted)", marginBottom: 4 }}>{row.label}</div>
      <div>
        <strong style={{ color: "var(--gold-300)" }}>{formatCents(row.grossCents)}</strong>
      </div>
      <div style={{ color: "var(--text-muted)" }}>
        {formatCount(row.paidOrders)} pedidos · {formatCount(row.distinctBuyers)} compradores
      </div>
      <div style={{ color: "var(--text-muted)" }}>{formatCredits(row.creditsSold)} créditos</div>
    </div>
  );
}

export function RevenueChart({
  series,
  bucket,
  onBucketChange,
  loading,
}: {
  series: RevenuePointJson[];
  bucket: BucketId;
  onBucketChange: (next: BucketId) => void;
  loading: boolean;
}) {
  // The server returns empty buckets as zeroes, so the axis is already
  // continuous — no gap filling here.
  const rows = useMemo<Row[]>(
    () =>
      series.map((point) => ({
        label: formatBucketLabel(point.bucketStart, bucket),
        reais: centsToReais(point.grossCents),
        grossCents: point.grossCents,
        paidOrders: point.paidOrders,
        creditsSold: point.creditsSold,
        distinctBuyers: point.distinctBuyers,
      })),
    [series, bucket],
  );

  return (
    <section
      style={{
        background: "var(--grad-panel)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--bevel-raise), var(--shadow-md)",
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--parchment-100)", margin: 0 }}>
            Receita ao longo do período
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", margin: "2px 0 0" }}>
            Buckets fechados em horário de Brasília. A semana começa na segunda-feira.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`wyd-btn wyd-btn--sm ${bucket === b.id ? "wyd-btn--steel" : "wyd-btn--ghost"}`}
              onClick={() => onBucketChange(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div style={{ height: 260, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Carregando…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ height: 260, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Sem movimento no período selecionado.
        </div>
      ) : (
        <div style={{ height: 260, opacity: loading ? 0.55 : 1, transition: "opacity 120ms" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--iron-500, #2a2620)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                stroke="var(--iron-400)"
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                stroke="var(--iron-400)"
                width={64}
                tickFormatter={(v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="reais" fill="var(--gold-400)" radius={[3, 3, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
