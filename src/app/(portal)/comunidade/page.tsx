import { Button, Badge } from "@/components/ui";
import {
  COMMUNITY_HIGHLIGHTS,
  COMMUNITY_SUPPORT,
  DISCORD_INVITE_URL,
  SERVER_NAME,
} from "@/lib/portal-data";

export default function CommunityPage() {
  return (
    <div className="wyd-screen wyd-container wyd-container--narrow">
      <header className="wyd-page-head">
        <div className="wyd-eyebrow">Nossa comunidade</div>
        <h1 className="wyd-title-gold">Comunidade</h1>
        <p>
          Tudo que acontece fora do jogo em <strong style={{ color: "var(--gold-300)" }}>{SERVER_NAME}</strong> passa
          pelo nosso Discord — avisos, eventos, suporte e a conversa do dia a dia.
        </p>
        <div className="wyd-divider wyd-divider--gem">
          <span />
        </div>
      </header>

      <div className="wyd-frame wyd-frame--gold wyd-frame--lg" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            <Badge variant="gold" style={{ marginBottom: 12 }}>
              Entrada livre
            </Badge>
            <h2 className="wyd-title-gold" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Discord oficial
            </h2>
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
              O servidor ainda está em evolução, e o Discord é onde você fica sabendo de tudo primeiro: quando cai,
              quando volta, o que mudou e quando começa o próximo evento. Entrar não custa nada e não exige conta no
              jogo.
            </p>
          </div>
          <div style={{ flex: "0 1 260px", minWidth: 200 }}>
            <Button href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" variant="cta" block>
              Entrar no Discord
            </Button>
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
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

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {/* What you find there */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 className="wyd-section-title wyd-title-gold">O que você encontra lá</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
            {COMMUNITY_HIGHLIGHTS.map((h) => (
              <div key={h.title} className="wyd-frame wyd-card">
                <div className="wyd-slot" style={{ minHeight: 0, width: 48, height: 48, padding: 0, fontSize: 20 }}>
                  {h.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--parchment-50)",
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
              </div>
            ))}
          </div>
        </div>

        {/* Guides and support */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 className="wyd-section-title wyd-title-gold">Guias e suporte</h2>
          <div className="wyd-frame wyd-frame--lg">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {COMMUNITY_SUPPORT.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="wyd-medal wyd-medal--1" style={{ flex: "none" }}>
                    {s.n}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--parchment-50)",
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
