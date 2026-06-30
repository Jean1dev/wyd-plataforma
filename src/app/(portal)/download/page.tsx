import type { CSSProperties } from "react";
import { Button, Badge } from "@/components/ui";
import { CLIENTS, STEPS, REQ_MIN, REQ_REC } from "@/lib/portal-data";

const panel: CSSProperties = {
  background: "var(--grad-panel)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--bevel-raise), var(--shadow-md)",
};

const sectionTitle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 22,
  color: "var(--gold-400)",
  margin: "0 0 14px",
};

export default function DownloadPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Entre na batalha
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 8px",
        }}
      >
        Baixar o Jogo
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--parchment-200)",
          maxWidth: 620,
          margin: "0 0 28px",
          textWrap: "pretty",
        }}
      >
        O cliente roda em <strong style={{ color: "var(--gold-300)" }}>Windows (PC)</strong>.
        Acompanhe sua conta, ranking e recompensas de qualquer dispositivo — o portal é responsivo.
      </p>

      {/* Clients */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
        {CLIENTS.map((d) => (
          <div
            key={d.os}
            style={{
              flex: "1 1 280px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: 22,
              borderRadius: "var(--radius-lg)",
              background: "var(--grad-panel)",
              border: d.tag ? "2px solid var(--gold-600)" : "1px solid var(--iron-400)",
              boxShadow: d.tag
                ? "var(--glow-gold), var(--shadow-md)"
                : "var(--bevel-raise), var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 48,
                  height: 48,
                  flex: "none",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface-inset)",
                  boxShadow: "var(--bevel-in)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "var(--gold-400)",
                }}
              >
                {d.icon}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 19,
                    color: "var(--parchment-100)",
                  }}
                >
                  {d.os}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>
                  {d.sub}
                </div>
              </div>
            </div>
            {d.tag ? <Badge variant="gold">{d.tag}</Badge> : null}
            <Button block variant={d.btnVariant}>
              {d.btnLabel}
            </Button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* How to start */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 style={sectionTitle}>Como começar</h2>
          <div style={{ ...panel, padding: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {STEPS.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flex: "none",
                      borderRadius: "50%",
                      border: "1px solid var(--gold-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--gold-300)",
                      background: "var(--surface-inset)",
                    }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--parchment-100)",
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 style={sectionTitle}>Requisitos</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 14,
            }}
          >
            <div style={{ ...panel, padding: 18 }}>
              <div className="wyd-eyebrow" style={{ marginBottom: 12, color: "var(--text-muted)" }}>
                Mínimo
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {REQ_MIN.map((q) => (
                  <div
                    key={q}
                    style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--parchment-200)" }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                background: "var(--grad-panel)",
                border: "2px solid var(--gold-600)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--glow-gold), var(--shadow-md)",
                padding: 18,
              }}
            >
              <div className="wyd-eyebrow" style={{ marginBottom: 12, color: "var(--gold-400)" }}>
                Recomendado
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {REQ_REC.map((q) => (
                  <div
                    key={q}
                    style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--parchment-100)" }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
