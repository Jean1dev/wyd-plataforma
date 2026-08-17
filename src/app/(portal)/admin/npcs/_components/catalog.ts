"use client";

import { useEffect, useState } from "react";
import type { ItemCatalogEntry, LookupStatus } from "@/lib/npc/types";

export type CatalogState = {
  items: ItemCatalogEntry[];
  /** item_index → entry, built once with the list. Use it to join tables/grids. */
  byIndex: Map<number, ItemCatalogEntry>;
  loading: boolean;
  // "ok" → picker ready; "empty" → web-api without -content; "unavailable" → fetch failed.
  status: LookupStatus;
  /** Convenience: status === "ok". */
  available: boolean;
};

type CatalogLoad = { items: ItemCatalogEntry[]; byIndex: Map<number, ItemCatalogEntry>; status: LookupStatus };

const EMPTY_INDEX: Map<number, ItemCatalogEntry> = new Map();

// The item catalog is large (~3200 entries) and identical across the page, so
// we fetch it once and share the promise between every combobox instance
// (shop editor slots + price editor).
let cache: Promise<CatalogLoad> | undefined;

function loadItemCatalog(): Promise<CatalogLoad> {
  if (!cache) {
    cache = fetch("/api/admin/items")
      .then(async (res) => {
        if (!res.ok) {
          // Allow a later retry (e.g. transient upstream failure).
          cache = undefined;
          return { items: [], byIndex: EMPTY_INDEX, status: "unavailable" as LookupStatus };
        }
        const data = (await res.json()) as { items?: ItemCatalogEntry[] };
        const items = data.items ?? [];
        const byIndex = new Map(items.map((it) => [it.item_index, it]));
        return { items, byIndex, status: (items.length > 0 ? "ok" : "empty") as LookupStatus };
      })
      .catch(() => {
        cache = undefined;
        return { items: [], byIndex: EMPTY_INDEX, status: "unavailable" as LookupStatus };
      });
  }
  return cache;
}

export function useItemCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    items: [],
    byIndex: EMPTY_INDEX,
    loading: true,
    status: "empty",
    available: false,
  });

  useEffect(() => {
    let active = true;
    loadItemCatalog().then(({ items, byIndex, status }) => {
      if (active) setState({ items, byIndex, loading: false, status, available: status === "ok" });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
