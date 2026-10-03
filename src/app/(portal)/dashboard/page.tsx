import { Button, Stat, StatBar, Badge, Tag, ClassCrest, HeroArt } from "@/components/ui";
import { NEWS, SERVER_NAME, EXP_RATE } from "@/lib/portal-data";
import { getSession } from "@/lib/auth/session";
import { characterRpc } from "@/lib/web-api/character-client";
import { normalizeCharacterSummary, type CharacterSummaryView } from "@/lib/web-api/character-normalize";
import { getDonateBalance } from "@/lib/donate/balance";
import { formatDonate as formatIntegerLike } from "@/lib/donate/format";

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
    <div className="wyd-screen wyd-container">
      {/* Hero */}
      <section className="wyd-frame wyd-frame--flush wyd-hero">
        <HeroArt sizes="(max-width: 1240px) 100vw, 1240px" className="wyd-hero__art" />
        <div className="wyd-hero__shade" />
        <div className="wyd-hero__body">
          <div className="wyd-eyebrow">Bem-vindo de volta, guerreiro</div>
          <h1 className="wyd-hero__title">Salão dos Heróis</h1>
          <p className="wyd-hero__lead">
            O servidor <strong style={{ color: "var(--gold-300)" }}>{SERVER_NAME}</strong> está online. Forje sua
            lenda, suba no ranking e domine as terras de Kersef.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            {/* Plain anchor: /jogar mints a one-use ticket and must not be prefetched. */}
            <a href="/jogar" className="wyd-btn wyd-btn--cta wyd-btn--md" style={{ marginInline: 30 }}>
              Jogar agora
            </a>
            <Button href="/recompensas" variant="ghost">
              Recompensa diária
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 18,
          marginBottom: 36,
        }}
      >
        <div className="wyd-frame">
          <Stat label="Jogadores Online" value="1.284" accent="var(--emerald-400)" sub="pico hoje: 1.902" />
        </div>
        <div className="wyd-frame wyd-frame--gold">
          <Stat
            label="Donate Coins"
            value={balanceState.status === "ready" ? formatIntegerLike(balanceState.balance) : "--"}
            accent="var(--gold-300)"
            sub={balanceState.status === "ready" ? "saldo atual" : "indisponível"}
          />
        </div>
        <div className="wyd-frame">
          <Stat label="Personagens" value={String(characters.length)} accent="var(--steel-300)" sub="vinculados" />
        </div>
        <div className="wyd-frame">
          <Stat label="Próxima Guerra" value="02:14" accent="var(--blood-400)" sub="Torre de Cristal" />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {/* Characters */}
        <div style={{ flex: "2 1 440px", minWidth: 0 }}>
          <h2 className="wyd-section-title wyd-title-gold">Meus Personagens</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {charactersState.status === "unavailable" ? (
              <div className="wyd-frame wyd-muted">Não foi possível carregar seus personagens agora.</div>
            ) : null}
            {charactersState.status === "ready" && characters.length === 0 ? (
              <div className="wyd-frame wyd-muted">Nenhum personagem vinculado a esta conta.</div>
            ) : null}
            {characters.map((c) => {
              const hpMax = characterMaxStat(c, "hp");
              const mpMax = characterMaxStat(c, "mp");

              return (
                <div
                  key={`${c.slot}-${c.name}`}
                  className="wyd-frame"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 18,
                    alignItems: "start",
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                    <div className="wyd-slot" style={{ minHeight: 0, padding: 4 }}>
                      {c.cls ? <ClassCrest cls={c.cls} size="lg" /> : <UnknownClassCrest label={c.classLabel} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: 19,
                          letterSpacing: "0.03em",
                          color: "var(--parchment-50)",
                        }}
                      >
                        {c.name}
                      </div>
                      <Badge variant="gold" style={{ marginTop: 5 }}>
                        Nível {c.level}
                      </Badge>
                      <div
                        style={{
                          marginTop: 6,
                          fontFamily: "var(--font-ui)",
                          fontSize: 11,
                          letterSpacing: "0.08em",
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
                      <MiniStat key={attr.label} label={attr.label} value={formatIntegerLike(attr.value)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Realm status + news */}
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <h2 className="wyd-section-title wyd-title-gold">Status do Reino</h2>
          <div className="wyd-frame" style={{ marginBottom: 28 }}>
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

          <h2 className="wyd-section-title wyd-title-gold">Últimas Notícias</h2>
          <div className="wyd-frame">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {NEWS.map((n) => (
                <div key={n.title} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gold-500)", flex: "none" }}>
                    {n.date}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--parchment-100)" }}>
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
    <div className="wyd-cell" style={{ minWidth: 96 }}>
      <div className="wyd-cell__label">{label}</div>
      <div className="wyd-cell__value">{value}</div>
    </div>
  );
}

function ServerRow({ name, status }: { name: string; status: "online" | "manutenção" }) {
  const online = status === "online";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--parchment-100)" }}>{name}</span>
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
