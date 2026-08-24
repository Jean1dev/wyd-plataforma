import type { ItemCatalogEntry } from "@/lib/npc/types";
import type { ItemIconData } from "./types";

// Wire entry → what an icon needs. Shared by the server catalog (catalog.ts)
// and the client-side admin catalog hook, so both paths project identically.
// Browser-safe on purpose: admin screens hold the raw wire entries.
export function toItemIconData(entry: ItemCatalogEntry): ItemIconData {
  return {
    itemIndex: entry.item_index,
    // display_name is empty on an older web-api that predates the visual
    // fields; the raw name still reads better than nothing.
    displayName: entry.display_name || entry.name,
    iconKey: entry.icon_key,
    iconUrl: entry.icon_url ?? "",
    slots: entry.slots ?? [],
    grade: entry.grade,
  };
}

/** Return only the manifest-approved URL supplied by the web-api. */
export function itemIconUrl(item: ItemIconData, iconPackVersion: string): string | null {
  if (!item.iconKey || !item.iconUrl || !iconPackVersion) return null;
  return item.iconUrl;
}
