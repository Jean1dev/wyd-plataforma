import { currentUserIsModerator } from "../_data";
import { NpcForm } from "../_components/NpcForm";
import { AdminHeader, StateNotice } from "../_components/StateNotice";

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function NewNpcPage() {
  if (!(await currentUserIsModerator())) {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">Esta área é exclusiva para moderadores.</StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação" title="Novo NPC" />
      <NpcForm />
    </div>
  );
}
