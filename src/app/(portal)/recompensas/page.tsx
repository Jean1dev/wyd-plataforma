import { getSession } from "@/lib/auth/session";
import { dailyRewardRpc } from "@/lib/web-api/daily-reward-client";
import { pickItemIcons } from "@/lib/item-catalog/catalog";
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
  // DailyRewardItem carries no visual fields — join by item_index against the
  // catalog, projected down to the offers on screen.
  const { icons, iconPackVersion } = await pickItemIcons(
    rewards.status === "ok" ? rewards.items.map((it) => it.item_index) : [],
  );

  return (
    <div className="wyd-screen wyd-container wyd-container--narrow">
      <header className="wyd-page-head">
        <div className="wyd-eyebrow">Bênção diária do reino</div>
        <h1 className="wyd-title-gold">Recompensas Diárias</h1>
        <p>
          Escolha uma oferta gratuita para resgatar hoje. Você pode resgatar{" "}
          <strong style={{ color: "var(--gold-300)" }}>uma vez por dia</strong>, entre todas as ofertas disponíveis.
        </p>
        <div className="wyd-divider wyd-divider--gem">
          <span />
        </div>
      </header>

      {rewards.status === "unavailable" ? (
        <div className="wyd-frame wyd-muted">
          Não foi possível carregar as recompensas agora. Verifique sua sessão e tente novamente.
        </div>
      ) : (
        <RewardGrid
          items={rewards.items}
          icons={icons}
          iconPackVersion={iconPackVersion}
          initialClaimedToday={rewards.claimedToday}
          initialClaimedItemId={rewards.claimedItemId}
          initialClaimedItemTitle={rewards.claimedItemTitle}
        />
      )}
    </div>
  );
}
