import type { CSSProperties } from "react";
import { Button, Badge } from "@/components/ui";
import {
  COMMUNITY_HIGHLIGHTS,
  COMMUNITY_SUPPORT,
  DISCORD_INVITE_URL,
  SERVER_NAME,
} from "@/lib/portal-data";

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

export default function CommunityPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Nossa comunidade
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
        Comunidade
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
        Tudo que acontece fora do jogo em{" "}
        <strong style={{ color: "var(--gold-300)" }}>{SERVER_NAME}</strong> passa pelo nosso
        Discord — avisos, eventos, suporte e a conversa do dia a dia.
      </p>

      <div
        style={{
          ...panel,
          padding: 22,
          marginBottom: 40,
          border: "2px solid var(--gold-600)",
          boxShadow: "var(--glow-gold), var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <Badge variant="gold" style={{ marginBottom: 12 }}>
              Entrada livre
            </Badge>
            <h2 style={{ ...sectionTitle, marginBottom: 8 }}>Discord oficial</h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                lineHeight: 1.55,
                color: "var(--parchment-200)",
                margin: 0,
                maxWidth: 720,
              }}
            >
              O servidor ainda está em evolução, e o Discord é onde você fica sabendo de tudo
              primeiro: quando cai, quando volta, o que mudou e quando começa o próximo evento.
              Entrar não custa nada e não exige conta no jogo.
            </p>
          </div>
          <div style={{ flex: "0 1 220px", minWidth: 180 }}>
            <Button href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" block>
              Entrar no Discord
            </Button>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
                wordBreak: "break-all",
              }}
            >
              {DISCORD_INVITE_URL.replace(/^https:\/\//, "")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* What you find there */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 style={sectionTitle}>O que você encontra lá</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 14,
            }}
          >
            {COMMUNITY_HIGHLIGHTS.map((h) => (
              <div key={h.title} style={{ ...panel, padding: 18 }}>
                <div style={{ fontSize: 20, color: "var(--gold-400)", lineHeight: 1 }}>{h.icon}</div>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--parchment-100)",
                  }}
                >
                  {h.title}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--text-muted)",
                  }}
                >
                  {h.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guides and support */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 style={sectionTitle}>Guias e suporte</h2>
          <div style={{ ...panel, padding: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {COMMUNITY_SUPPORT.map((s) => (
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
                        lineHeight: 1.5,
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
      </div>
    </div>
  );
}
