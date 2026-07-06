import type { ReactNode } from "react";

// Plain presentational panel (no client hooks) reusable from server components
// for forbidden / not-found / upstream states.
export function StateNotice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--grad-panel)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--bevel-raise), var(--shadow-md)",
        padding: "28px 24px",
        maxWidth: 640,
      }}
    >
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--parchment-100)", margin: "0 0 8px" }}>
        {title}
      </h2>
      {children ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function AdminHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
      <div>
        <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(26px,4vw,34px)",
            color: "var(--gold-400)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

export default StateNotice;
