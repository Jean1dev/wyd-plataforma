import { RankingsBoard } from "@/components/RankingsBoard";
import { SERVER_NAME } from "@/lib/portal-data";

export default function RankingsPage() {
  return (
    <div
      className="wyd-screen"
      style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px 72px" }}
    >
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        {SERVER_NAME} · Temporada 7
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 22px",
        }}
      >
        Salão dos Campeões
      </h1>
      <RankingsBoard />
    </div>
  );
}
