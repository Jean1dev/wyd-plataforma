"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LoadStatus } from "./api";
import { errorMessage } from "./api";

// Table chrome shared by the three tabs. Same tokens as NpcAdminTable/DropTool.

export const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--iron-400)",
  whiteSpace: "nowrap",
};

export const cell: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--iron-500, #2a2620)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-body)",
  verticalAlign: "middle",
};

export const monoCell: React.CSSProperties = { ...cell, fontFamily: "var(--font-mono)" };

export const numericCell: React.CSSProperties = { ...cell, fontFamily: "var(--font-mono)", textAlign: "right" };

export const numericTh: React.CSSProperties = { ...th, textAlign: "right" };

export function TablePanel({ children, minWidth = 860 }: { children: ReactNode; minWidth?: number }) {
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
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth }}>{children}</table>
    </div>
  );
}

/**
 * True when there are rows worth showing. Kept true while a new page loads so
 * the previous rows stay on screen instead of flashing to "Carregando…".
 */
export function hasRows(status: LoadStatus, rowCount: number): boolean {
  return rowCount > 0 && (status === "ok" || status === "loading");
}

/**
 * The states every tab has to distinguish. An empty window is a valid 200 and
 * must not look like a failure — that is the whole point of separating
 * "emptyLabel" from the error branch.
 */
export function TableState({
  status,
  empty,
  emptyLabel,
  onRetry,
}: {
  status: LoadStatus;
  empty: boolean;
  emptyLabel: string;
  onRetry?: () => void;
}) {
  const box: React.CSSProperties = {
    padding: "22px 16px",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    color: "var(--text-muted)",
    textAlign: "center",
  };

  if (status === "loading" || status === "idle") return <div style={box}>Carregando…</div>;

  if (status !== "ok") {
    return (
      <div style={{ ...box, color: "var(--blood-400)" }}>
        {errorMessage(status)}
        {onRetry && status !== "forbidden" ? (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="wyd-btn wyd-btn--ghost wyd-btn--sm" onClick={onRetry}>
              Tentar novamente
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (empty) return <div style={box}>{emptyLabel}</div>;

  return null;
}

export function Pagination({
  offset,
  pageSize,
  rowCount,
  totalCount,
  loading,
  onOffsetChange,
}: {
  offset: number;
  pageSize: number;
  rowCount: number;
  totalCount: number;
  loading: boolean;
  onOffsetChange: (next: number) => void;
}) {
  const hasPrevious = offset > 0;
  const hasNext = offset + rowCount < totalCount;
  const range = rowCount > 0 ? `${offset + 1}-${offset + rowCount} de ${totalCount}` : `0 de ${totalCount}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}>{range}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="wyd-btn wyd-btn--ghost wyd-btn--sm"
          disabled={!hasPrevious || loading}
          onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
        >
          <ChevronLeft size={15} />
          Anterior
        </button>
        <button
          type="button"
          className="wyd-btn wyd-btn--steel wyd-btn--sm"
          disabled={!hasNext || loading}
          onClick={() => onOffsetChange(offset + pageSize)}
        >
          Próxima
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
