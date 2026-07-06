"use client";

import { useMemo, useRef, useState } from "react";

export type ComboOption = { value: string; label: string; hint?: string };

type Props = {
  label?: string;
  /** Committed raw value (string form of template_name / item_index). */
  value: string;
  onChange: (value: string) => void;
  /** Fired when an option is picked (lets the caller derive extra fields, e.g. merchant). */
  onSelect?: (opt: ComboOption) => void;
  options: ComboOption[];
  /** false → the picker is unavailable; render only the manual field. */
  available: boolean;
  loading?: boolean;
  placeholder?: string;
  manualPlaceholder?: string;
  manualHint?: string;
  manualInputMode?: "numeric" | "text";
  disabled?: boolean;
  maxResults?: number;
  /** Compact single-input variant (for dense grids like the shop slots). */
  compact?: boolean;
};

const legendStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

export function Combobox({
  label,
  value,
  onChange,
  onSelect,
  options,
  available,
  loading,
  placeholder = "Buscar…",
  manualPlaceholder,
  manualHint,
  manualInputMode = "text",
  disabled,
  maxResults = 50,
  compact = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? options.filter(
          (o) => o.label.toLowerCase().includes(q) || o.value.includes(q) || o.hint?.toLowerCase().includes(q),
        )
      : options;
    return base.slice(0, maxResults);
  }, [options, query, maxResults]);

  function pick(opt: ComboOption) {
    onChange(opt.value);
    onSelect?.(opt);
    setQuery("");
    setFocused(false);
  }

  const dropdown = (
    <ul
      style={{
        position: "absolute",
        zIndex: 20,
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        margin: 0,
        padding: 4,
        listStyle: "none",
        maxHeight: 260,
        overflowY: "auto",
        background: "var(--surface-inset, #1b1813)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {filtered.map((opt) => (
        <li key={opt.value}>
          <button
            type="button"
            // onMouseDown fires before the input blur, so the pick isn't lost.
            onMouseDown={(e) => {
              e.preventDefault();
              pick(opt);
            }}
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              gap: 10,
              padding: "7px 9px",
              background: "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-body)",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span>{opt.label}</span>
            {opt.hint ? (
              <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {opt.hint}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );

  // Compact single-input variant. When available, the input searches while
  // focused and shows the resolved item label otherwise; typing a raw number
  // and blurring commits it manually. When unavailable, it's a plain field.
  if (compact) {
    const displayText = focused ? query : selected ? `${selected.label} (${selected.value})` : value;
    return (
      <div style={{ position: "relative" }}>
        <input
          value={displayText}
          placeholder={available ? (loading ? "Carregando…" : placeholder) : manualPlaceholder}
          disabled={disabled || (available && loading)}
          inputMode={available ? "text" : manualInputMode}
          onChange={(e) => {
            if (!available) {
              onChange(e.target.value);
              return;
            }
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (!available) return;
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setQuery("");
            setFocused(true);
          }}
          onBlur={() => {
            if (!available) return;
            blurTimer.current = setTimeout(() => {
              // Commit a manually typed number if the user didn't pick an option.
              setQuery((q) => {
                if (/^\d+$/.test(q.trim())) onChange(q.trim());
                return q;
              });
              setFocused(false);
            }, 120);
          }}
          style={inputStyle}
        />
        {available && focused && filtered.length > 0 ? dropdown : null}
      </div>
    );
  }

  // Manual-only mode: no picker available, show the raw field with a hint.
  if (!available) {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label ? <span style={legendStyle}>{label}</span> : null}
        <input
          value={value}
          inputMode={manualInputMode}
          placeholder={manualPlaceholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
        {manualHint ? (
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-muted)" }}>{manualHint}</span>
        ) : null}
      </label>
    );
  }

  const showDropdown = focused && filtered.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label ? <span style={legendStyle}>{label}</span> : null}

      <div style={{ position: "relative" }}>
        <input
          value={query}
          placeholder={loading ? "Carregando…" : placeholder}
          disabled={disabled || loading}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setFocused(false), 120);
          }}
          style={inputStyle}
        />
        {showDropdown ? dropdown : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>
          {value ? (
            <>
              Selecionado:{" "}
              <strong style={{ color: "var(--parchment-100)" }}>{selected ? selected.label : value}</strong>
              {selected ? <span style={{ fontFamily: "var(--font-mono)" }}> ({selected.value})</span> : null}
            </>
          ) : (
            "Nenhum selecionado."
          )}
        </span>
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--gold-300)",
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {manualOpen ? "Ocultar manual" : "Digitar manualmente"}
        </button>
      </div>

      {manualOpen ? (
        <input
          value={value}
          inputMode={manualInputMode}
          placeholder={manualPlaceholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      ) : null}
    </div>
  );
}

export default Combobox;
