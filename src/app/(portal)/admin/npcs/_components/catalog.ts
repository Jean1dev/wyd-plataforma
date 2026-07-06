"use client";

import { useEffect, useState } from "react";
import type { ItemCatalogEntry } from "@/lib/npc/types";

export type CatalogState = {
  items: ItemCatalogEntry[];
  loading: boolean;
  /** false → the picker is unavailable (empty catalog or fetch failed); fall back to a manual field. */
  available: boolean;
};

// The item catalog is large (~3200 entries) and identical across the page, so
// we fetch it once and share the promise between every combobox instance
// (shop editor slots + price editor).
let cache: Promise<ItemCatalogEntry[]> | undefined;

function loadItemCatalog(): Promise<ItemCatalogEntry[]> {
  if (!cache) {
    cache = fetch("/api/admin/items")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: ItemCatalogEntry[] }) => data.items ?? [])
      .catch(() => {
        // Allow a later retry (e.g. transient upstream failure).
        cache = undefined;
        return [];
      });
  }
  return cache;
}

export function useItemCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ items: [], loading: true, available: false });

  useEffect(() => {
    let active = true;
    loadItemCatalog().then((items) => {
      if (active) setState({ items, loading: false, available: items.length > 0 });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
