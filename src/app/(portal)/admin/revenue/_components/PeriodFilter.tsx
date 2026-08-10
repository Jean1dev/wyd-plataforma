"use client";

import { useMemo, useState } from "react";
import { brtDateInputValue } from "@/lib/revenue/format";

// The period is held as two `YYYY-MM-DD` calendar dates in Brasília, which is
// how the operator thinks about it and how the server closes its buckets. The
// BFF turns `to` into the start of the following day, so the end date is
// inclusive here.

export type Period = { from: string; to: string };

const MAX_WINDOW_DAYS = 366;

/** Calendar arithmetic on the BRT date parts, done in UTC so it never shifts. */
function shiftDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + days);
  return new Date(t).toISOString().slice(0, 10);
}

function daysBetweenInclusive(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const diff = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);
  return Math.floor(diff / 86_400_000) + 1;
}

function firstOfMonth(dateOnly: string, monthOffset = 0): string {
  const [y, m] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + monthOffset, 1)).toISOString().slice(0, 10);
}

function lastOfMonth(dateOnly: string, monthOffset = 0): string {
  const [y, m] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y, m + monthOffset, 0)).toISOString().slice(0, 10);
}

export function todayBrt(): string {
  return brtDateInputValue(new Date());
}

export function defaultPeriod(): Period {
  const today = todayBrt();
  return { from: shiftDays(today, -29), to: today };
}

/** Mirrors the server's rules so the operator gets the message before the 422. */
export function periodError(period: Period): string | null {
  if (!period.from || !period.to) return "Informe as duas datas do período.";
  if (period.from > period.to) return "A data inicial precisa vir antes da final.";
  if (daysBetweenInclusive(period.from, period.to) > MAX_WINDOW_DAYS) {
    return `O período não pode passar de ${MAX_WINDOW_DAYS} dias.`;
  }
  return null;
}

type Preset = { id: string; label: string; build: (today: string) => Period };

const PRESETS: Preset[] = [
  { id: "7d", label: "7 dias", build: (t) => ({ from: shiftDays(t, -6), to: t }) },
  { id: "30d", label: "30 dias", build: (t) => ({ from: shiftDays(t, -29), to: t }) },
  { id: "90d", label: "90 dias", build: (t) => ({ from: shiftDays(t, -89), to: t }) },
  { id: "month", label: "Mês atual", build: (t) => ({ from: firstOfMonth(t), to: t }) },
  {
    id: "prev-month",
    label: "Mês anterior",
    build: (t) => ({ from: firstOfMonth(t, -1), to: lastOfMonth(t, -1) }),
  },
];

const dateInput: React.CSSProperties = {
  padding: "8px 10px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  colorScheme: "dark",
};

const legend: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

export function PeriodFilter({ period, onChange }: { period: Period; onChange: (next: Period) => void }) {
  const today = useMemo(() => todayBrt(), []);
  const [draft, setDraft] = useState(period);

  const draftError = periodError(draft);
  const dirty = draft.from !== period.from || draft.to !== period.to;

  function applyPreset(preset: Preset) {
    const next = preset.build(today);
    setDraft(next);
    onChange(next);
  }

  function apply() {
    if (draftError) return;
    onChange(draft);
  }

  const activePreset = PRESETS.find((p) => {
    const built = p.build(today);
    return built.from === period.from && built.to === period.to;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`wyd-btn wyd-btn--sm ${activePreset?.id === preset.id ? "wyd-btn--steel" : "wyd-btn--ghost"}`}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={legend}>De</span>
          <input
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            style={dateInput}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={legend}>Até</span>
          <input
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            style={dateInput}
          />
        </label>
        <button
          type="button"
          className="wyd-btn wyd-btn--primary wyd-btn--sm"
          disabled={!dirty || draftError !== null}
          onClick={apply}
        >
          Aplicar
        </button>
      </div>

      {draftError ? (
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--blood-400)" }}>{draftError}</span>
      ) : (
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)" }}>
          Datas e fechamento de período em horário de Brasília (BRT). A data final é inclusiva.
        </span>
      )}
    </div>
  );
}
