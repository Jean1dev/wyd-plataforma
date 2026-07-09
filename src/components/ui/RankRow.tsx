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
  classCode,
  clan,
  classMaster,
  level,
  score,
  guildId,
}: {
  rank: number;
  name: string;
  cls?: WydClass;
  classCode: number;
  clan: number;
  classMaster: number;
  level: number;
  score: string;
  guildId: number;
}) {
  const detail = [
    guildId > 0 ? `Guilda ${guildId}` : "",
    clan ? `Reino ${clan}` : "",
    `Tier ${classMaster}`,
  ].filter(Boolean);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 38px minmax(0,1fr) 58px 74px minmax(96px,130px)",
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
      <span style={{ width: 38, display: "flex", justifyContent: "center" }}>
        {cls ? (
          <ClassCrest cls={cls} size="sm" />
        ) : (
          <span
            title={`Classe ${classCode}`}
            style={{
              width: 32,
              height: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--iron-400)",
              background: "var(--surface-inset)",
              color: "var(--text-faint)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
            }}
          >
            {classCode}
          </span>
        )}
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
        {detail.length > 0 ? (
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-2xs)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {detail.join(" · ")}
          </div>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--steel-300)",
        }}
      >
        {level}
      </span>
      <span
        style={{
          textAlign: "right",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          color: "var(--gold-300)",
          fontWeight: 500,
          overflowWrap: "anywhere",
        }}
      >
        {score}
      </span>
      <span
        style={{
          textAlign: "right",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-2xs)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-faint)",
        }}
      >
        Classe {classCode}
      </span>
    </div>
  );
}

export default RankRow;
