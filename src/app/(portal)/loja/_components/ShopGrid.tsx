"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { formatDonate } from "@/lib/donate/format";
import type { DonateShopItem } from "@/lib/donate/types";
import { BuyOfferButton } from "./BuyOfferButton";

export function ShopGrid({ items, initialBalance }: { items: DonateShopItem[]; initialBalance: string }) {
  const [balance, setBalance] = useState(initialBalance);

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
        <div style={{ maxWidth: 520, color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 13 }}>
          A entrega acontece no armazém da conta no próximo login. Mantenha espaço livre: se o armazém estiver
          cheio, o item pode ser perdido.
        </div>
      </div>

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
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-inset)",
                  boxShadow: "var(--bevel-in)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--gold-300)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 24 }}>#{it.item_index}</div>
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
