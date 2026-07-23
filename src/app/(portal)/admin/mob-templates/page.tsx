import { AdminHeader, StateNotice } from "../npcs/_components/StateNotice";
import { currentUserIsModerator } from "./_data";
import { RestartBanner } from "./_components/RestartBanner";
import { TemplatePicker } from "./_components/TemplatePicker";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

// ListMobTemplates returns every npc/ file (mostly common monsters, not just
// shopkeepers), so this page IS the picker — no separate table.
export default async function AdminMobTemplatesPage() {
  const isModerator = await currentUserIsModerator();

  if (!isModerator) {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">
          Esta área é exclusiva para moderadores. Se você deveria ter acesso, peça a um administrador para
          definir <code>account.role = &apos;moderator&apos;</code> na sua conta.
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação" title="Stats de Mob" />
      <RestartBanner />
      <TemplatePicker />
    </div>
  );
}
