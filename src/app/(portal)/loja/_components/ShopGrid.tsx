"use client";

import { useState } from "react";
import { Badge, Button, ItemIcon } from "@/components/ui";
import { formatDonate } from "@/lib/donate/format";
import type { ItemIconMap } from "@/lib/item-catalog/types";
import type { DonateShopItem } from "@/lib/donate/types";
import { BuyOfferButton } from "./BuyOfferButton";
import { TopupModal } from "./TopupModal";

type Props = { items: DonateShopItem[]; icons: ItemIconMap; initialBalance: string };

export function ShopGrid({ items, icons, initialBalance }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [topupOpen, setTopupOpen] = useState(false);

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: 18,
          background: "var(--grad-panel)",
          border: "1px solid var(--iron-400)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--bevel-raise), var(--shadow-md)",
        }}
      >
        <div>
          <div className="wyd-eyebrow" style={{ marginBottom: 4 }}>
            Saldo atual
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--gold-300)" }}>
            {formatDonate(balance)} Donate
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 520 }}>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 13 }}>
            A entrega acontece no armazém da conta no próximo login. Mantenha espaço livre: se o armazém estiver
            cheio, o item pode ser perdido.
          </div>
          <Button type="button" size="sm" onClick={() => setTopupOpen(true)}>
            Recarregar créditos
          </Button>
        </div>
      </div>

      {topupOpen ? <TopupModal onClose={() => setTopupOpen(false)} onBalance={setBalance} /> : null}

      {items.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Nenhuma oferta disponível no momento.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                background: "var(--grad-panel)",
                border: "1px solid var(--iron-400)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--bevel-raise), var(--shadow-md)",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  minHeight: 92,
                  padding: 10,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-inset)",
                  boxShadow: "var(--bevel-in)",
                  display: "grid",
                  placeItems: "center",
                  gap: 6,
                  color: "var(--gold-300)",
                }}
              >
                <ItemIcon item={icons[it.item_index]} itemIndex={it.item_index} size="lg" />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Kept visible: support and moderators troubleshoot by index. */}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    #{it.item_index}
                  </span>
                  {it.expires_days > 0 ? <Badge variant="gold">{it.expires_days} dias</Badge> : null}
                </div>
              </div>
              <div style={{ minHeight: 74 }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--parchment-100)",
                    marginBottom: 5,
                  }}
                >
                  {it.title}
                </div>
                {/* Catalog name, when the offer title renamed the item — makes a
                    wrong item_index visible instead of silently plausible. */}
                {icons[it.item_index] && icons[it.item_index].displayName !== it.title ? (
                  <div
                    style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", marginBottom: 5 }}
                  >
                    {icons[it.item_index].displayName}
                  </div>
                ) : null}
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {it.description || "Item permanente para entrega no armazém."}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "var(--font-mono)",
                    fontSize: 15,
                    color: "var(--gold-300)",
                    paddingTop: 7,
                  }}
                >
                  <span style={{ color: "var(--gold-400)" }}>◆</span>
                  {formatDonate(it.price)}
                </span>
                <BuyOfferButton itemId={it.id} onBalance={setBalance} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
