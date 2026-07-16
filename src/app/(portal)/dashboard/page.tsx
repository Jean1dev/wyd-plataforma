import type { CSSProperties } from "react";
import { Button, Stat, StatBar, Badge, Tag, ClassCrest } from "@/components/ui";
import { NEWS, SERVER_NAME, EXP_RATE } from "@/lib/portal-data";
import { getSession } from "@/lib/auth/session";
import { characterRpc } from "@/lib/web-api/character-client";
import { normalizeCharacterSummary, type CharacterSummaryView } from "@/lib/web-api/character-normalize";
import { getDonateBalance } from "@/lib/donate/balance";
import { formatDonate as formatIntegerLike } from "@/lib/donate/format";

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

const cardTitle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 18,
  color: "var(--parchment-100)",
};

const statLabel: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-faint)",
};

type CharactersState =
  | { status: "ready"; characters: CharacterSummaryView[] }
  | { status: "unavailable"; characters: [] };

type BalanceState = { status: "ready"; balance: string } | { status: "unavailable"; balance: "0" };

async function loadCharacters(): Promise<CharactersState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return { status: "ready", characters: [] };

  try {
    const resp = await characterRpc("ListMyCharacters", { account_id: session.accountId });
    return { status: "ready", characters: (resp.characters ?? []).map((c) => normalizeCharacterSummary(c)) };
  } catch {
    return { status: "unavailable", characters: [] };
  }
}

async function loadDonateBalance(): Promise<BalanceState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return { status: "ready", balance: "0" };

  const balance = await getDonateBalance(session.accountId);
  return balance === null ? { status: "unavailable", balance: "0" } : { status: "ready", balance };
}

function characterMaxStat(c: CharacterSummaryView, key: "hp" | "mp") {
  return key === "hp" ? c.maxHp : c.maxMp;
}

function characterAttributes(c: CharacterSummaryView) {
  return [
    { label: "STR", value: c.strength },
    { label: "INT", value: c.intelligence },
    { label: "DEX", value: c.dexterity },
    { label: "CON", value: c.constitution },
  ];
}

export default async function DashboardPage() {
  const [charactersState, balanceState] = await Promise.all([loadCharacters(), loadDonateBalance()]);
  const characters = charactersState.characters;

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
          <Stat
            label="Donate Coins"
            value={balanceState.status === "ready" ? formatIntegerLike(balanceState.balance) : "--"}
            accent="var(--gold-300)"
            sub={balanceState.status === "ready" ? "saldo atual" : "indisponível"}
          />
        </div>
        <div style={{ ...panel, padding: 18 }}>
          <Stat label="Personagens" value={String(characters.length)} accent="var(--steel-300)" sub="vinculados" />
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
            {charactersState.status === "unavailable" ? (
              <div style={{ ...panel, padding: 18, color: "var(--parchment-200)", fontFamily: "var(--font-body)" }}>
                Não foi possível carregar seus personagens agora.
              </div>
            ) : null}
            {charactersState.status === "ready" && characters.length === 0 ? (
              <div style={{ ...panel, padding: 18, color: "var(--parchment-200)", fontFamily: "var(--font-body)" }}>
                Nenhum personagem vinculado a esta conta.
              </div>
            ) : null}
            {characters.map((c) => {
              const hpMax = characterMaxStat(c, "hp");
              const mpMax = characterMaxStat(c, "mp");

              return (
                <div
                  key={`${c.slot}-${c.name}`}
                  style={{
                    ...panel,
                    padding: 18,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                    {c.cls ? (
                      <ClassCrest cls={c.cls} size="lg" />
                    ) : (
                      <UnknownClassCrest label={c.classLabel} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={cardTitle}>{c.name}</div>
                      <Badge variant="gold" style={{ marginTop: 4 }}>
                        Nível {c.level}
                      </Badge>
                      <div
                        style={{
                          marginTop: 6,
                          fontFamily: "var(--font-ui)",
                          fontSize: 11,
                          color: "var(--text-faint)",
                          textTransform: "uppercase",
                        }}
                      >
                        Slot {c.slot} · {c.classLabel}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                    <StatBar kind="hp" value={c.hp} max={hpMax} label="HP" />
                    <StatBar kind="mp" value={c.mp} max={mpMax} label="MP" />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <MiniStat label="EXP" value={formatIntegerLike(c.exp)} />
                      <MiniStat label="Coin" value={formatIntegerLike(c.coin)} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                      alignSelf: "stretch",
                    }}
                  >
                    {characterAttributes(c).map((attr) => (
                      <div
                        key={attr.label}
                        style={{
                          border: "1px solid var(--iron-400)",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(255,255,255,0.02)",
                          padding: "10px 12px",
                        }}
                      >
                        <div style={statLabel}>{attr.label}</div>
                        <div
                          style={{
                            marginTop: 4,
                            fontFamily: "var(--font-display)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--parchment-100)",
                            lineHeight: 1.1,
                          }}
                        >
                          {formatIntegerLike(attr.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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

function UnknownClassCrest({ label }: { label: string }) {
  return (
    <span
      title={label}
      style={{
        width: 56,
        height: 56,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-inset)",
        border: "1px solid var(--iron-300)",
        boxShadow: "var(--bevel-in)",
        color: "var(--steel-300)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 16,
      }}
    >
      ?
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        minWidth: 96,
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-md)",
        padding: "8px 10px",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={statLabel}>{label}</div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--parchment-100)",
          lineHeight: 1.1,
        }}
      >
        {value}
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
