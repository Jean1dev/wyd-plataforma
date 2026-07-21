import { AdminHeader, StateNotice } from "../npcs/_components/StateNotice";
import { getSession, isModerator } from "@/lib/auth/session";
import { DropTool } from "./_components/DropTool";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function AdminDropsPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.accountId || !isModerator(session)) {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">
          Esta área é exclusiva para moderadores. Se você deveria ter acesso, peça a um administrador para definir{" "}
          <code>account.role = &apos;moderator&apos;</code> na sua conta.
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação" title="DropTool de Drops" />
      <DropTool />
    </div>
  );
}
