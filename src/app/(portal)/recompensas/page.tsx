import { getSession } from "@/lib/auth/session";
import { dailyRewardRpc } from "@/lib/web-api/daily-reward-client";
import type { RewardLoadState } from "@/lib/daily-reward/types";
import { RewardGrid } from "./_components/RewardGrid";

async function loadRewards(): Promise<RewardLoadState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) {
    return { status: "unavailable" };
  }

  try {
    const [rewards, status] = await Promise.all([
      dailyRewardRpc("ListRewards", {}),
      dailyRewardRpc("GetClaimStatus", { account_id: session.accountId }),
    ]);
    return {
      status: "ok",
      items: rewards.items ?? [],
      claimedToday: status.claimed_today ?? false,
      claimedItemId: status.claimed_item_id ?? "0",
      claimedItemTitle: status.claimed_item_title ?? "",
    };
  } catch {
    return { status: "unavailable" };
  }
}

export default async function RecompensasPage() {
  const rewards = await loadRewards();

  return (
    <div className="wyd-screen" style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px 72px" }}>
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Bênção diária do reino
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 6px",
        }}
      >
        Recompensas Diárias
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--parchment-200)",
          maxWidth: 560,
          margin: "0 0 24px",
          textWrap: "pretty",
        }}
      >
        Escolha uma oferta gratuita para resgatar hoje. Você pode resgatar{" "}
        <strong style={{ color: "var(--gold-300)" }}>uma vez por dia</strong>, entre todas as ofertas disponíveis.
      </p>

      {rewards.status === "unavailable" ? (
        <div
          style={{
            background: "var(--grad-panel)",
            border: "1px solid var(--iron-400)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--bevel-raise), var(--shadow-md)",
            padding: 22,
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Não foi possível carregar as recompensas agora. Verifique sua sessão e tente novamente.
        </div>
      ) : (
        <RewardGrid
          items={rewards.items}
          initialClaimedToday={rewards.claimedToday}
          initialClaimedItemId={rewards.claimedItemId}
          initialClaimedItemTitle={rewards.claimedItemTitle}
        />
      )}
    </div>
  );
}
