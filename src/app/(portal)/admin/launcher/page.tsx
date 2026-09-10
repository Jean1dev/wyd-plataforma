import { getSession, isModerator } from "@/lib/auth/session";
import { LauncherUpload } from "./_components/LauncherUpload";
import { AdminHeader, StateNotice } from "../npcs/_components/StateNotice";

export default async function AdminLauncherPage() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId || !isModerator(session)) {
    return <div className="wyd-screen" style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" }}><StateNotice title="Acesso restrito">Esta área é exclusiva para moderadores.</StateNotice></div>;
  }
  return <div className="wyd-screen" style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" }}><AdminHeader eyebrow="Distribuição" title="Client do Launcher" /><LauncherUpload /></div>;
}
