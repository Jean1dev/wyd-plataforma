import { Button, Badge } from "@/components/ui";
import { PACKS, ITEMS } from "@/lib/portal-data";

export default function LojaPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Tesouro do Reino
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 24px",
        }}
      >
        Loja de Donate
      </h1>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--parchment-100)", margin: "0 0 14px" }}>
        Recarregar Donate Coins
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {PACKS.map((p) => {
          const best = p.tag === "Melhor valor";
          return (
            <div
              key={p.coins}
              style={{
                textAlign: "center",
                position: "relative",
                padding: "26px 18px",
                borderRadius: "var(--radius-lg)",
                background: "var(--grad-panel)",
                border: best ? "2px solid var(--gold-600)" : "1px solid var(--iron-400)",
                boxShadow: best
                  ? "var(--glow-gold), var(--shadow-md)"
                  : "var(--bevel-raise), var(--shadow-md)",
                color: "var(--text-body)",
              }}
            >
              {p.tag ? (
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <Badge variant={p.tagVariant}>{p.tag}</Badge>
                </div>
              ) : null}
              <div style={{ fontSize: 30, color: "var(--gold-400)", marginBottom: 6 }}>◈</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "var(--gold-300)",
                }}
              >
                {p.coins}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Donate Coins
              </div>
              {p.bonus ? (
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "var(--emerald-400)",
                    marginBottom: 12,
                  }}
                >
                  {p.bonus}
                </div>
              ) : null}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  color: "var(--parchment-100)",
                  margin: "8px 0 16px",
                }}
              >
                {p.price}
              </div>
              <Button block>Comprar</Button>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--parchment-100)", margin: "0 0 14px" }}>
        Itens do Jogo
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        {ITEMS.map((it) => (
          <div
            key={it.name}
            style={{
              background: "var(--grad-panel)",
              border: "1px solid var(--iron-400)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--bevel-raise), var(--shadow-md)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                height: 90,
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-inset)",
                boxShadow: "var(--bevel-in)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                color: "var(--iron-200)",
              }}
            >
              {it.icon}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--parchment-100)",
                minHeight: 40,
              }}
            >
              {it.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--font-mono)",
                  fontSize: 15,
                  color: "var(--gold-300)",
                }}
              >
                <span style={{ color: "var(--gold-400)" }}>◈</span>
                {it.cost}
              </span>
              <Button size="sm" variant="ghost">
                Resgatar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
