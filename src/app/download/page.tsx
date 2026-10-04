import Image from "next/image";
import Link from "next/link";
import { Button, HeroArt } from "@/components/ui";
import { SiteFooter } from "@/components/SiteFooter";
import { REQ_MIN, REQ_REC } from "@/lib/portal-data";

export default function DownloadPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="wyd-screen wyd-container wyd-container--narrow" style={{ flex: 1, width: "100%" }}>
        <nav
          aria-label="Navegação"
          style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}
        >
          <Link href="/" style={{ marginRight: "auto" }}>
            <Image
              src="/assets/wyd-logo-crop.png"
              alt="WYD"
              width={77}
              height={36}
              style={{ height: 36, width: "auto", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}
            />
          </Link>
          <Button href="/" variant="ghost" size="sm">
            Entrar / Criar conta
          </Button>
          <Button href="/dashboard" variant="ghost" size="sm">
            Painel
          </Button>
        </nav>

        {/* Hero */}
        <section className="wyd-frame wyd-frame--flush wyd-hero">
          <HeroArt sizes="(max-width: 1040px) 100vw, 1040px" className="wyd-hero__art" />
          <div className="wyd-hero__shade" />
          <div className="wyd-hero__body">
            <div className="wyd-eyebrow">Entre na batalha</div>
            <h1 className="wyd-hero__title">Baixar o Jogo</h1>
            <p className="wyd-hero__lead">
              Baixe o launcher para Windows 10/11 (64 bits). Ele instala o jogo e prepara a conexão automaticamente.
              Mantenha o launcher aberto enquanto joga.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <a className="wyd-btn wyd-btn--cta wyd-btn--md" href="/api/launcher/download" style={{ marginInline: 30 }}>
                Baixar launcher para Windows
              </a>
              {/* Plain anchor: /jogar mints a one-use ticket and must not be prefetched. */}
              <a href="/jogar" className="wyd-btn wyd-btn--ghost wyd-btn--md">
                Jogar no navegador
              </a>
            </div>
          </div>
        </section>

        <div className="wyd-frame wyd-frame--lg" style={{ marginBottom: 36 }}>
          <h2 className="wyd-title-gold" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Launcher WYD Kersef
          </h2>
          <p style={{ color: "var(--parchment-200)", margin: 0 }}>
            Instale o launcher, escolha a pasta do jogo e clique em instalar para começar.
          </p>
        </div>

        <h2 className="wyd-section-title wyd-title-gold">Requisitos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
          <div className="wyd-frame">
            <div className="wyd-eyebrow" style={{ marginBottom: 12, color: "var(--text-muted)" }}>
              Mínimo
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {REQ_MIN.map((q) => (
                <div key={q} style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--parchment-200)" }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div className="wyd-frame wyd-frame--gold">
            <div className="wyd-eyebrow" style={{ marginBottom: 12, color: "var(--gold-400)" }}>
              Recomendado
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {REQ_REC.map((q) => (
                <div key={q} style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--parchment-100)" }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
