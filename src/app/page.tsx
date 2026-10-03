import Image from "next/image";
import { AuthTabs } from "@/components/AuthTabs";
import { Button, Crest, HeroArt } from "@/components/ui";
import { DISCORD_INVITE_URL, SERVER_NAME } from "@/lib/portal-data";

export default function LoginPage() {
  return (
    <div className="wyd-auth">
      <div className="wyd-auth__art">
        <HeroArt sizes="(max-width: 900px) 100vw, 55vw" />
        <div className="wyd-auth__art-shade" />
        <div className="wyd-auth__brand">
          <Image
            src="/assets/wyd-logo-crop.png"
            alt="WYD"
            width={103}
            height={48}
            style={{ height: 48, width: "auto", filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.85))" }}
          />
          <span>{SERVER_NAME.split(" ")[0]}</span>
        </div>
        <div className="wyd-auth__pitch wyd-screen">
          <h1 className="wyd-hero__title">
            O mundo espera
            <br />
            por você.
          </h1>
          <p>Retorne a Kersef. Reúna seu grupo.</p>
          <p>A próxima batalha começa aqui.</p>
          <div className="wyd-auth__sig">
            <span>{SERVER_NAME}</span>
            <i />
            <span>With Your Destiny</span>
          </div>
        </div>
      </div>

      <div className="wyd-auth__panel">
        <div className="wyd-auth__card wyd-screen">
          <div className="wyd-frame wyd-frame--lg wyd-frame--crest">
            <Crest />
            <h2 className="wyd-auth__title wyd-title-gold">Acessar Conta</h2>
            <AuthTabs />

            <div style={{ marginTop: 24 }}>
              <div className="wyd-divider wyd-divider--gem" style={{ marginBottom: 16 }}>
                <span />
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--parchment-300)",
                  margin: "0 0 12px",
                }}
              >
                Dúvidas ou quer conhecer o servidor antes de criar a conta?
              </p>
              <Button
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
                block
              >
                Entrar no Discord
              </Button>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 18,
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--iron-200)",
            }}
          >
            Acesse de qualquer dispositivo —{" "}
            <span style={{ color: "var(--gold-300)" }}>PC, celular ou tablet</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
