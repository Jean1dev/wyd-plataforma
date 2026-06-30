type BarKind = "hp" | "mp" | "exp";

const BAR_COLOR: Record<BarKind, string> = {
  hp: "var(--bar-hp)",
  mp: "var(--bar-mp)",
  exp: "var(--bar-exp)",
};

export function StatBar({
  kind,
  value,
  max,
  label,
}: {
  kind: BarKind;
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const isExp = kind === "exp";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-2xs)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
        }}
      >
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>
          {isExp ? `${value}%` : `${value} / ${max}`}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: "var(--radius-pill)",
          background: "var(--surface-inset)",
          boxShadow: "var(--bevel-in)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "var(--radius-pill)",
            background: BAR_COLOR[kind],
            boxShadow: `0 0 8px ${BAR_COLOR[kind]}`,
          }}
        />
      </div>
    </div>
  );
}

export default StatBar;
