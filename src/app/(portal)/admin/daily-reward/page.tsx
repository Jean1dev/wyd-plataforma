import { AdminHeader, StateNotice } from "../npcs/_components/StateNotice";
import { listRewardItems } from "./_data";
import { RewardItemForm } from "./_components/RewardItemForm";
import { RewardItemsTable } from "./_components/RewardItemsTable";

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "32px 24px 72px" };

export default async function AdminDailyRewardPage() {
  const result = await listRewardItems();

  if (result.status === "forbidden") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="Acesso restrito">
          Esta área é exclusiva para moderadores. Se você deveria ter acesso, peça a um administrador para definir{" "}
          <code>account.role = &apos;moderator&apos;</code> na sua conta.
        </StateNotice>
      </div>
    );
  }

  if (result.status !== "ok") {
    return (
      <div className="wyd-screen" style={wrap}>
        <StateNotice title="web-api indisponível">
          Não foi possível carregar as ofertas de recompensa diária. Verifique se o serviço <code>web-api</code> está
          no ar e tente novamente.
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="wyd-screen" style={wrap}>
      <AdminHeader eyebrow="Moderação" title="Recompensa Diária" />

      <div style={{ display: "grid", gap: 20 }}>
        <RewardItemsTable items={result.items} />
        <section
          style={{
            background: "var(--grad-panel)",
            border: "1px solid var(--iron-400)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--bevel-raise), var(--shadow-md)",
            padding: 18,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--parchment-100)", margin: "0 0 14px" }}>
            Nova oferta
          </h2>
          <RewardItemForm />
        </section>
      </div>
    </div>
  );
}
