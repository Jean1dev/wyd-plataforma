import { AdminHeader, StateNotice } from "../npcs/_components/StateNotice";
import { currentUserIsModerator } from "./_data";
import { RevenueDashboard } from "./_components/RevenueDashboard";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function AdminRevenuePage() {
  if (!(await currentUserIsModerator())) {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">
          O painel de faturamento é exclusivo para moderadores. Se você deveria ter acesso, peça a um administrador
          para ajustar o seu papel na conta.
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação" title="Faturamento" />
      <RevenueDashboard />
    </div>
  );
}
