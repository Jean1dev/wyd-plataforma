import { getSession } from "@/lib/auth/session";
import { donateShopRpc } from "@/lib/web-api/donate-shop-client";
import { pickItemIcons } from "@/lib/item-catalog/catalog";
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
    return { status: "ok", items: shop.items ?? [], balance: String(balance.balance ?? 0) };
  } catch {
    return { status: "unavailable", items: [], balance: "0" };
  }
}

export default async function LojaPage() {
  const shop = await loadShop();
  // DonateShopItem carries no visual fields — join by item_index against the
  // catalog, projected down to the offers on screen. An empty map is fine: the
  // grid falls back to the generic icon.
  const { icons, iconPackVersion } = await pickItemIcons(shop.items.map((it) => it.item_index));

  return (
    <div className="wyd-screen wyd-container">
      <header className="wyd-page-head">
        <div className="wyd-eyebrow">Tesouro do Reino</div>
        <h1 className="wyd-title-gold">Loja de Donate</h1>
        <div className="wyd-divider wyd-divider--gem">
          <span />
        </div>
      </header>

      {shop.status === "unavailable" ? (
        <div className="wyd-frame wyd-muted">
          Não foi possível carregar a loja agora. Verifique sua sessão e tente novamente.
        </div>
      ) : (
        <ShopGrid
          items={shop.items}
          icons={icons}
          iconPackVersion={iconPackVersion}
          initialBalance={shop.balance}
        />
      )}
    </div>
  );
}
