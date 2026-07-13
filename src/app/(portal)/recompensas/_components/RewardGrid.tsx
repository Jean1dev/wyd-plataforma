"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import type { DailyRewardItem } from "@/lib/daily-reward/types";
import { ClaimRewardButton } from "./ClaimRewardButton";

type Props = {
  items: DailyRewardItem[];
  initialClaimedToday: boolean;
  initialClaimedItemId: string;
  initialClaimedItemTitle: string;
};

// Claiming any offer blocks every other offer for the rest of the UTC day
// (unlike the donate shop, where buying one item doesn't affect the others) —
// so claim state lives here, at the grid level, rather than per-button.
export function RewardGrid({ items, initialClaimedToday, initialClaimedItemId, initialClaimedItemTitle }: Props) {
  const [claimedToday, setClaimedToday] = useState(initialClaimedToday);
  const [claimedItemId, setClaimedItemId] = useState(initialClaimedItemId);
  // Falls back to the server-supplied title when the claimed offer isn't in
  // `items` (e.g. it was disabled/deleted after the claim).
  const claimedItemTitle = items.find((it) => it.id === claimedItemId)?.title ?? initialClaimedItemTitle;

  function handleClaimed(itemId: string) {
    setClaimedToday(true);
    setClaimedItemId(itemId);
  }

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
            Status de hoje
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--gold-300)" }}>
            {claimedToday ? `Resgatado: ${claimedItemTitle || "oferta removida"}` : "Você ainda não resgatou hoje"}
          </div>
        </div>
        <div style={{ maxWidth: 520, color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 13 }}>
          A entrega acontece no armazém da conta no próximo login. Resgates renovam às 00:00 UTC. Mantenha espaço
          livre: se o armazém estiver cheio, o item pode ser perdido.
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          Nenhuma oferta disponível no momento.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {items.map((it) => {
            const isClaimedItem = claimedToday && it.id === claimedItemId;
            return (
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
                  opacity: claimedToday && !isClaimedItem ? 0.55 : 1,
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
                  <div
                    style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}
                  >
                    {it.description || "Item gratuito para entrega no armazém."}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {isClaimedItem ? (
                    <Badge variant="gold">Resgatado hoje</Badge>
                  ) : (
                    <ClaimRewardButton itemId={it.id} disabled={claimedToday} onClaimed={handleClaimed} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
