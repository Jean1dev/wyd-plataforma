"use client";

import { useState } from "react";
import {
  Footprints,
  Gem,
  Hand,
  HardHat,
  Package,
  Rabbit,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { gradeMeta } from "@/lib/item-catalog/grade";
import type { ItemIconData } from "@/lib/item-catalog/types";
import { itemIconUrl } from "@/lib/item-catalog/view";

const SIZES = { sm: 26, md: 40, lg: 76 } as const;

const SLOT_ICONS: Record<string, LucideIcon> = {
  face: HardHat,
  helmet: HardHat,
  armor: Shirt,
  pants: Shirt,
  gloves: Hand,
  boots: Footprints,
  weapon: Sword,
  shield: Shield,
  accessory: Gem,
  amulet: Gem,
  orb: Gem,
  gem: Gem,
  medal: Gem,
  fairy: Sparkles,
  mount: Rabbit,
  cape: Wind,
};

type Props = {
  /** Catalog join result. Undefined = unknown index or empty catalog. */
  item?: ItemIconData;
  /** Always known, even when `item` isn't, so the fallback remains useful. */
  itemIndex: number;
  iconPackVersion: string;
  size?: keyof typeof SIZES;
};

export function ItemIcon({ item, itemIndex, iconPackVersion, size = "md" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const px = SIZES[size];
  const meta = gradeMeta(item?.grade);
  const name = item?.displayName || `Item #${itemIndex}`;
  const title = !item
    ? name
    : meta.label
      ? `${name} — ${meta.label} (#${itemIndex})`
      : `${name} (#${itemIndex})`;
  const slot = item?.slots[0] ?? "none";
  const Fallback = SLOT_ICONS[slot] ?? Package;
  const src = item ? itemIconUrl(item, iconPackVersion) : null;
  const showImage = Boolean(src && failedSrc !== src);

  return (
    <div
      title={title}
      className="item-icon"
      data-slot={slot}
      data-grade={item?.grade ?? 0}
      style={{
        flex: "none",
        width: px,
        height: px,
        display: "grid",
        placeItems: "center",
        position: "relative",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-inset)",
        border: `1px solid ${meta.label && item?.grade !== 1 ? meta.color : "var(--iron-400)"}`,
        boxShadow: "var(--bevel-in)",
        overflow: "hidden",
      }}
    >
      <Fallback size={Math.round(px * 0.6)} color={meta.color} aria-hidden="true" />
      {showImage ? (
        // The web-api supplies the complete manifest-approved URL. A plain img
        // supports arbitrary CDN hosts and lets the fallback remain underneath.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          width={35}
          height={35}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 35,
            height: 35,
            transform: "translate(-50%, -50%)",
            objectFit: "contain",
            imageRendering: "auto",
          }}
        />
      ) : null}
      <span className="sr-only">{name}</span>
    </div>
  );
}

export default ItemIcon;
