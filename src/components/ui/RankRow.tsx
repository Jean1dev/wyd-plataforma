import { ClassCrest, type WydClass } from "./ClassCrest";

function rankColor(rank: number) {
  if (rank === 1) return "var(--gold-300)";
  if (rank === 2) return "var(--steel-300)";
  if (rank === 3) return "var(--parchment-300)";
  return "var(--text-faint)";
}

export function RankRow({
  rank,
  name,
  cls,
  level,
  score,
  guild,
}: {
  rank: number;
  name: string;
  cls: WydClass;
  level: number;
  score: string;
  guild?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 14px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <span
        style={{
          width: 32,
          textAlign: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "var(--text-lg)",
          color: rankColor(rank),
        }}
      >
        {rank}
      </span>
      <span style={{ width: 28, display: "flex" }}>
        <ClassCrest cls={cls} size="sm" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--parchment-100)",
          }}
        >
          {name}
        </div>
        {guild ? (
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-2xs)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {guild}
          </div>
        ) : null}
      </div>
      <span
        style={{
          width: 50,
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--steel-300)",
        }}
      >
        {level}
      </span>
      <span
        style={{
          width: 70,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--gold-300)",
          fontWeight: 500,
        }}
      >
        {score}
      </span>
    </div>
  );
}

export default RankRow;
