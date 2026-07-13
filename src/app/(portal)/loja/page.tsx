import { getSession } from "@/lib/auth/session";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";
import type { ShopLoadState } from "@/lib/donate/types";
import { ShopGrid } from "./_components/ShopGrid";

async function loadShop(): Promise<ShopLoadState> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.accountId) return { status: "unavailable", items: [], balance: "0" };

  try {
    const [shop, balance] = await Promise.all([
      donateShopRpc("ListShopItems", {}),
      donateShopRpc("GetBalance", { account_id: session.accountId }),
    ]);
    return { status: "ok", items: shop.items ?? [], balance: balance.balance ?? "0" };
  } catch {
    return { status: "unavailable", items: [], balance: "0" };
  }
}

export default async function LojaPage() {
  const shop = await loadShop();

  return (
    <div className="wyd-screen" style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px 72px" }}>
      <div className="wyd-eyebrow" style={{ marginBottom: 6 }}>
        Tesouro do Reino
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "clamp(30px,5vw,38px)",
          color: "var(--gold-400)",
          margin: "0 0 24px",
        }}
      >
        Loja de Donate
      </h1>

      {shop.status === "unavailable" ? (
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
          Não foi possível carregar a loja agora. Verifique sua sessão e tente novamente.
        </div>
      ) : (
        <ShopGrid items={shop.items} initialBalance={shop.balance} />
      )}
    </div>
  );
}
