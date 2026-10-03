import { RankingsBoard } from "@/components/RankingsBoard";
import { SERVER_NAME } from "@/lib/portal-data";

export default function RankingsPage() {
  return (
    <div className="wyd-screen wyd-container wyd-container--narrow">
      <header className="wyd-page-head">
        <div className="wyd-eyebrow">{SERVER_NAME} · Temporada 7</div>
        <h1 className="wyd-title-gold">Salão dos Campeões</h1>
        <div className="wyd-divider wyd-divider--gem">
          <span />
        </div>
      </header>
      <RankingsBoard />
    </div>
  );
}
