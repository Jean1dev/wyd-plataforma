import "server-only";

import { itemCatalogRpc } from "@/lib/web-api/item-catalog-client";
import type { ItemIconData, ItemIconMap } from "./types";
import { toItemIconData } from "./view";

// Server-side item catalog, fetched once per process and indexed by item_index.
//
// The catalog is immutable at runtime — web-api reads Release/Common/ItemList.csv
// once at boot from a read-only mount — so `version` (a fingerprint of that file)
// only changes on redeploy. That makes a plain module-scoped memo the right cache
// here; there is no revalidation window to tune. The browser-side twin of this is
// admin/npcs/_components/catalog.ts.
//
// The whole list is ~3.2k entries. Never pass it to a client component: project
// it with pickItemIcons() down to the indexes the screen actually renders.

export type ItemCatalog = { version: string; byIndex: Map<number, ItemIconData> };

const EMPTY: ItemCatalog = { version: "", byIndex: new Map() };

let cached: ItemCatalog | undefined;
let inFlight: Promise<ItemCatalog> | undefined;

async function loadCatalog(): Promise<ItemCatalog> {
  let resp;
  try {
    resp = await itemCatalogRpc("ListItems", {});
  } catch {
    // web-api down or RPC not deployed yet. Degrade like an empty catalog, and
    // don't cache it — the next render retries.
    return EMPTY;
  }

  const byIndex = new Map<number, ItemIconData>();
  for (const it of resp.items ?? []) {
    byIndex.set(it.item_index, toItemIconData(it));
  }
  const catalog: ItemCatalog = { version: resp.catalog_version ?? "", byIndex };

  // An empty catalog (version "") means web-api started without
  // -content/W2PP_CONTENT. That is NOT an error — the screens fall back — but it
  // must NOT be cached: if web-api is redeployed with content, a process that
  // cached the empty map would keep serving it, icons silently stuck on the
  // fallback, until restart. `version === ""` is the cheap check.
  if (catalog.version !== "") cached = catalog;
  return catalog;
}

/**
 * The catalog, or an empty one. Only a real (non-empty) catalog is memoized;
 * see loadCatalog. Concurrent cold calls share one request — without the
 * dedupe, N renders would each pull ~400 KB before the first one cached.
 */
export function getItemCatalog(): Promise<ItemCatalog> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = loadCatalog().finally(() => {
      inFlight = undefined;
    });
  }
  return inFlight;
}

/** item_index → icon data for just these indexes. Unknown indexes are omitted. */
export async function pickItemIcons(indexes: number[]): Promise<ItemIconMap> {
  const { byIndex } = await getItemCatalog();
  const out: ItemIconMap = {};
  for (const index of indexes) {
    const item = byIndex.get(index);
    if (item) out[index] = item;
  }
  return out;
}
