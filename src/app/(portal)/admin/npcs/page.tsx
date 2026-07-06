import { Button } from "@/components/ui";
import { listNpcs } from "./_data";
import { NpcAdminTable } from "./_components/NpcAdminTable";
import { AdminHeader, StateNotice } from "./_components/StateNotice";

// Moderation table. Reads run server-side; a non-moderator (or a web-api
// FORBIDDEN) renders a restricted panel instead of the list. Reading the
// session cookie already opts this route into dynamic rendering.
const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" };

export default async function AdminNpcsPage() {
  const result = await listNpcs();

  if (result.status === "forbidden") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">
          Esta área é exclusiva para moderadores. Se você deveria ter acesso, peça a um administrador para
          definir <code>account.role = &apos;moderator&apos;</code> na sua conta.
        </StateNotice>
      </div>
    );
  }

  if (result.status !== "ok") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="web-api indisponível">
          Não foi possível carregar os NPCs. Verifique se o serviço <code>web-api</code> está no ar e tente
          novamente.
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader
        eyebrow="Moderação"
        title="Editar NPCs"
        action={
          <Button href="/admin/npcs/new" size="sm">
            Novo NPC
          </Button>
        }
      />
      <NpcAdminTable npcs={result.data} />
    </div>
  );
}
