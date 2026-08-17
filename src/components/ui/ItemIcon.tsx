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

// Renders an item. The *fallback* is the guaranteed path, not a temporary one:
// it covers items the original client never had, gaps in the icon pack, and the
// degraded mode where web-api runs without -content (empty catalog). The real
// image, when a pack exists, is decoration layered on top.
//
// `iconKey` is opaque. It happens to look like "m<mesh>_t<texture>_p<mask>"
// today, but if the client turns out to address its art differently, the format
// changes server-side and nothing here moves. Never parse it.
//
// Refinement (+1..+9), quantity and rarity framing are CSS/SVG overlays here —
// baking them into files would multiply the pack tenfold, and refinement is
// per-item-instance state that the catalog does not even carry.

const SIZES = { sm: 26, md: 40, lg: 76 } as const;

// slots[0] → fallback art. `slots` arrives already decoded from the nPos
// bitmask (server-side), so this maps names, never bits. An empty `slots` means
// "not equippable" — 890 of the ~3.2k items (potions, coupons, chests) — and
// gets the generic box rather than a guessed slot.
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

// Base URL of the icon pack (item-icons Fase 2). Undefined today: no pack is
// published yet, so we render the fallback directly instead of firing a 404 per
// item. Next inlines NEXT_PUBLIC_* at build time, so this must stay a literal.
const ICON_BASE = process.env.NEXT_PUBLIC_ITEM_ICON_BASE;

type Props = {
  /** Catalog join result. Undefined = unknown index or empty catalog. */
  item?: ItemIconData;
  /** Always known, even when `item` isn't — keeps the tooltip useful. */
  itemIndex: number;
  size?: keyof typeof SIZES;
};

export function ItemIcon({ item, itemIndex, size = "md" }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  const px = SIZES[size];
  const meta = gradeMeta(item?.grade);
  // Without a catalog entry the name already *is* the index, so don't repeat it.
  const name = item?.displayName || `Item #${itemIndex}`;
  const title = !item
    ? name
    : meta.label
      ? `${name} — ${meta.label} (#${itemIndex})`
      : `${name} (#${itemIndex})`;

  const Fallback = SLOT_ICONS[item?.slots[0] ?? ""] ?? Package;
  const showImage = Boolean(ICON_BASE && item?.iconKey) && !imageFailed;

  return (
    <div
      title={title}
      style={{
        flex: "none",
        width: px,
        height: px,
        display: "grid",
        placeItems: "center",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-inset)",
        // Rarity frame. Normal/ungraded items stay neutral so the coloured
        // border actually means something on the ones that have it.
        border: `1px solid ${meta.label && item?.grade !== 1 ? meta.color : "var(--iron-400)"}`,
        boxShadow: "var(--bevel-in)",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        // Plain <img>: the pack may live on an arbitrary base URL, and we need
        // onError to fall through to the SVG below. next/image would require
        // remotePatterns for every deployment of the pack.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${ICON_BASE}/${item!.iconKey}.webp`}
          alt={name}
          width={px}
          height={px}
          // Flips state instead of reassigning src: the <img> unmounts and an
          // inline SVG takes its place, so onError can only fire once and the
          // fallback costs no request. Reassigning src to a fallback URL (as
          // the backend's integration doc sketches) can loop when that URL 404s
          // too — don't "simplify" this back into that shape.
          onError={() => setImageFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <Fallback size={Math.round(px * 0.6)} color={meta.color} aria-label={name} />
      )}
    </div>
  );
}

export default ItemIcon;
