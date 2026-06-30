import type { CSSProperties } from "react";
import { Button, Stat, StatBar, Badge, Tag, ClassCrest } from "@/components/ui";
import { CHARS, NEWS, SERVER_NAME, EXP_RATE } from "@/lib/portal-data";

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
  margin: 0,
};

export default function DashboardPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      {/* Hero */}
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--iron-400)",
          marginBottom: 32,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "url('/assets/wyd-keyart.png') center 28%/cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(10,8,5,0.94) 28%, rgba(10,8,5,0.35) 100%)",
          }}
        />
        <div style={{ position: "relative", padding: 36 }}>
          <div className="wyd-eyebrow" style={{ marginBottom: 8 }}>
            Bem-vindo de volta, guerreiro
          </div>
          <h1
            style={{
              fontFamily: "var(--font-hero)",
              fontWeight: 900,
              fontSize: "clamp(34px,6vw,48px)",
              color: "#fff",
              margin: "0 0 12px",
              textShadow: "0 3px 14px #000",
            }}
          >
            Salão dos Heróis
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "var(--parchment-200)",
              maxWidth: 480,
              margin: "0 0 20px",
              textWrap: "pretty",
            }}
          >
            O servidor <strong style={{ color: "var(--gold-300)" }}>{SERVER_NAME}</strong> está
            online. Forje sua lenda, suba no ranking e domine as terras de Kersef.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button href="/recompensas">Recompensa diária</Button>
            <Button href="/rankings" variant="ghost">
              Ver Rankings
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div style={{ ...panel, padding: 18 }}>
          <Stat label="Jogadores Online" value="1.284" accent="var(--emerald-400)" sub="pico hoje: 1.902" />
        </div>
        <div style={{ ...panel, padding: 18 }}>
          <Stat label="Donate Coins" value="12.500" accent="var(--gold-300)" sub="saldo atual" />
        </div>
        <div style={{ ...panel, padding: 18 }}>
          <Stat label="Personagens" value="3" accent="var(--steel-300)" sub="vinculados" />
        </div>
        <div style={{ ...panel, padding: 18 }}>
          <Stat label="Próxima Guerra" value="02:14" accent="var(--blood-400)" sub="Torre de Cristal" />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Characters */}
        <div style={{ flex: "2 1 440px", minWidth: 0 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={sectionTitle}>Meus Personagens</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {CHARS.map((c) => (
              <div
                key={c.name}
                style={{
                  ...panel,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <ClassCrest cls={c.cls} size="lg" />
                <div style={{ flex: "none", width: 130 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "var(--parchment-100)",
                    }}
                  >
                    {c.name}
                  </div>
                  <Badge variant="gold" style={{ marginTop: 4 }}>
                    Nível {c.level}
                  </Badge>
                </div>
                <div
                  style={{
                    flex: "1 1 200px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                    minWidth: 180,
                  }}
                >
                  <StatBar kind="hp" value={c.hp0} max={c.hp1} label="HP" />
                  <StatBar kind="mp" value={c.mp0} max={c.mp1} label="MP" />
                  <StatBar kind="exp" value={c.exp} max={100} label="EXP" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realm status + news */}
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 14px" }}>Status do Reino</h2>
          <div style={{ ...panel, padding: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ServerRow name={SERVER_NAME} status="online" />
              <ServerRow name="Azran — Classic" status="online" />
              <ServerRow name="Servidor de Teste" status="manutenção" />
              <div
                style={{
                  borderTop: "1px solid var(--iron-400)",
                  paddingTop: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Tag color="gold">EXP {EXP_RATE}</Tag>
                <Tag color="steel">Drop x10</Tag>
                <Tag color="iron">Sem Bug de Set</Tag>
              </div>
            </div>
          </div>

          <h2 style={{ ...sectionTitle, margin: "0 0 14px" }}>Últimas Notícias</h2>
          <div
            className="wyd-parchment"
            style={{ boxShadow: "var(--shadow-md)", padding: 20 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {NEWS.map((n) => (
                <div key={n.title} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--gold-800)",
                      flex: "none",
                    }}
                  >
                    {n.date}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      color: "var(--obsidian-800)",
                    }}
                  >
                    {n.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerRow({ name, status }: { name: string; status: "online" | "manutenção" }) {
  const online = status === "online";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--parchment-100)" }}>
        {name}
      </span>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: online ? "var(--emerald-400)" : "var(--gold-400)",
        }}
      >
        ● {status}
      </span>
    </div>
  );
}
