"use client";

import { useState } from "react";
import { Badge, ItemIcon } from "@/components/ui";
import type { DailyRewardItem } from "@/lib/daily-reward/types";
import type { ItemIconMap } from "@/lib/item-catalog/types";
import { ClaimRewardButton } from "./ClaimRewardButton";

type Props = {
  items: DailyRewardItem[];
  icons: ItemIconMap;
  iconPackVersion: string;
  initialClaimedToday: boolean;
  initialClaimedItemId: string;
  initialClaimedItemTitle: string;
};

// Claiming any offer blocks every other offer for the rest of the UTC day
// (unlike the donate shop, where buying one item doesn't affect the others) —
// so claim state lives here, at the grid level, rather than per-button.
export function RewardGrid({
  items,
  icons,
  iconPackVersion,
  initialClaimedToday,
  initialClaimedItemId,
  initialClaimedItemTitle,
}: Props) {
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
        }}
        className="wyd-frame wyd-frame--gold"
      >
        <div>
          <div className="wyd-eyebrow" style={{ marginBottom: 4 }}>
            Status de hoje
          </div>
          <div className="wyd-title-gold" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
          {items.map((it) => {
            const isClaimedItem = claimedToday && it.id === claimedItemId;
            return (
              <div
                key={it.id}
                className={[
                  "wyd-frame wyd-card",
                  isClaimedItem ? "wyd-frame--gold" : "",
                  claimedToday && !isClaimedItem ? "wyd-card--dim" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={isClaimedItem ? "wyd-slot wyd-slot--glow" : "wyd-slot"}>
                  <ItemIcon
                    item={icons[it.item_index]}
                    itemIndex={it.item_index}
                    iconPackVersion={iconPackVersion}
                    size="lg"
                  />
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
                      fontFamily: "var(--font-display)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--parchment-50)",
                      marginBottom: 5,
                    }}
                  >
                    {it.title}
                  </div>
                  {/* Catalog name, when the offer title renamed the item — makes a
                      wrong item_index visible instead of silently plausible. */}
                  {icons[it.item_index] && icons[it.item_index].displayName !== it.title ? (
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        color: "var(--text-faint)",
                        marginBottom: 5,
                      }}
                    >
                      {icons[it.item_index].displayName}
                    </div>
                  ) : null}
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
