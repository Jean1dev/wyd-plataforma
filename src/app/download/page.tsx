import type { CSSProperties } from "react";
import { Button } from "@/components/ui";
import {
  REQ_MIN,
  REQ_REC,
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

export default function DownloadPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <nav aria-label="Navegação" style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <Button href="/" variant="ghost">Entrar / Criar conta</Button>
        <Button href="/dashboard" variant="ghost">Painel</Button>
      </nav>
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
        Baixe o launcher para Windows 10/11 (64 bits). Ele instala o jogo e prepara
        a conexão automaticamente. Mantenha o launcher aberto enquanto joga.
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
            <h2 style={{ ...sectionTitle, marginBottom: 8 }}>Launcher WYD Kersef</h2>
            <p style={{ color: "var(--parchment-200)", margin: 0 }}>
              Instale o launcher, escolha a pasta do jogo e clique em instalar para começar.
            </p>
          </div>
          <div style={{ flex: "0 1 220px", minWidth: 180 }}>
            <a className="wyd-btn wyd-btn--primary wyd-btn--md wyd-btn--block" href="/api/launcher/download">
              Baixar launcher para Windows
            </a>
          </div>
        </div>


      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
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
