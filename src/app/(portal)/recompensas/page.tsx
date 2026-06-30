import type { CSSProperties } from "react";
import { Button } from "@/components/ui";
import { REWARDS, CLAIMED_DAYS } from "@/lib/portal-data";

type CellState = {
  border: string;
  bg: string;
  opacity: number;
  transform: string;
  glow: string;
  statusText: string;
  statusColor: string;
  iconColor: string;
};

function cellState(day: number, claimed: number): CellState {
  if (day <= claimed) {
    return {
      border: "1px solid var(--emerald-600)",
      bg: "rgba(62,140,90,0.10)",
      opacity: 0.9,
      transform: "none",
      glow: "",
      statusText: "Resgatado",
      statusColor: "var(--emerald-400)",
      iconColor: "var(--emerald-400)",
    };
  }
  if (day === claimed + 1) {
    return {
      border: "2px solid var(--gold-500)",
      bg: "var(--grad-panel)",
      opacity: 1,
      transform: "scale(1.03)",
      glow: "var(--glow-gold), ",
      statusText: "Disponível",
      statusColor: "var(--gold-300)",
      iconColor: "var(--gold-300)",
    };
  }
  return {
    border: "1px solid var(--iron-400)",
    bg: "var(--surface-inset)",
    opacity: 0.5,
    transform: "none",
    glow: "",
    statusText: "Bloqueado",
    statusColor: "var(--text-faint)",
    iconColor: "var(--text-faint)",
  };
}

export default function RecompensasPage() {
  const claimed = CLAIMED_DAYS;
  const canClaim = claimed < 7;
  const nextReward = canClaim ? REWARDS[claimed] : null;
  const dayWord = claimed === 1 ? "dia" : "dias";

  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Bênção diária do reino
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 6px",
        }}
      >
        Recompensas Diárias
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--parchment-200)",
          maxWidth: 560,
          margin: "0 0 24px",
          textWrap: "pretty",
        }}
      >
        Entre todos os dias e mantenha sua sequência. No{" "}
        <strong style={{ color: "var(--gold-300)" }}>7º dia</strong> uma recompensa lendária aguarda.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "var(--surface-inset)",
            border: "1px solid var(--gold-700)",
            borderRadius: "var(--radius-pill)",
            boxShadow: "var(--bevel-in)",
          }}
        >
          <span style={{ color: "var(--gold-400)", fontSize: 16 }}>✦</span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-300)",
            }}
          >
            Sequência atual: {claimed} {dayWord}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)" }}>
          {canClaim ? `Próxima: ${nextReward?.label}` : "Sequência completa!"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {REWARDS.map((r, i) => {
          const day = i + 1;
          const s = cellState(day, claimed);
          const cell: CSSProperties = {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textAlign: "center",
            padding: "18px 12px",
            minHeight: 160,
            borderRadius: "var(--radius-md)",
            border: s.border,
            background: s.bg,
            boxShadow: `${s.glow}var(--bevel-raise)`,
            opacity: s.opacity,
            transform: s.transform,
            transition: "transform var(--dur-base) var(--ease-out)",
          };
          return (
            <div key={r.label} style={cell}>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                }}
              >
                Dia {day}
              </div>
              <div style={{ fontSize: 32, color: s.iconColor, lineHeight: 1 }}>{r.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--parchment-100)",
                  textAlign: "center",
                  lineHeight: 1.25,
                }}
              >
                {r.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: s.statusColor,
                }}
              >
                {s.statusText}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Button size="lg" disabled={!canClaim}>
          {canClaim ? `Resgatar Dia ${claimed + 1}` : "Tudo resgatado"}
        </Button>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-faint)" }}>
          Recompensas reiniciam a cada 7 dias.
        </span>
      </div>
    </div>
  );
}
