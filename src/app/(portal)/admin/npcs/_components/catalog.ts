"use client";

import { useEffect, useState } from "react";
import type { ItemCatalogEntry, LookupStatus } from "@/lib/npc/types";

export type CatalogState = {
  items: ItemCatalogEntry[];
  /** item_index → entry, built once with the list. Use it to join tables/grids. */
  byIndex: Map<number, ItemCatalogEntry>;
  catalogVersion: string;
  iconPackVersion: string;
  loading: boolean;
  // "ok" → picker ready; "empty" → web-api without -content; "unavailable" → fetch failed.
  status: LookupStatus;
  /** Convenience: status === "ok". */
  available: boolean;
};

type CatalogLoad = {
  items: ItemCatalogEntry[];
  byIndex: Map<number, ItemCatalogEntry>;
  catalogVersion: string;
  iconPackVersion: string;
  status: LookupStatus;
};

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
          return {
            items: [],
            byIndex: EMPTY_INDEX,
            catalogVersion: "",
            iconPackVersion: "",
            status: "unavailable" as LookupStatus,
          };
        }
        const data = (await res.json()) as {
          items?: ItemCatalogEntry[];
          catalog_version?: string;
          icon_pack_version?: string;
        };
        const items = data.items ?? [];
        const byIndex = new Map(items.map((it) => [it.item_index, it]));
        // Empty version means the web-api has no configured content. Serve the
        // fallback now, but let the next mount retry instead of pinning it.
        if (!data.catalog_version) cache = undefined;
        return {
          items,
          byIndex,
          catalogVersion: data.catalog_version ?? "",
          iconPackVersion: data.icon_pack_version ?? "",
          status: (items.length > 0 ? "ok" : "empty") as LookupStatus,
        };
      })
      .catch(() => {
        cache = undefined;
        return {
          items: [],
          byIndex: EMPTY_INDEX,
          catalogVersion: "",
          iconPackVersion: "",
          status: "unavailable" as LookupStatus,
        };
      });
  }
  return cache;
}

export function useItemCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    items: [],
    byIndex: EMPTY_INDEX,
    catalogVersion: "",
    iconPackVersion: "",
    loading: true,
    status: "empty",
    available: false,
  });

  useEffect(() => {
    let active = true;
    loadItemCatalog().then(({ items, byIndex, catalogVersion, iconPackVersion, status }) => {
      if (active) {
        setState({
          items,
          byIndex,
          catalogVersion,
          iconPackVersion,
          loading: false,
          status,
          available: status === "ok",
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
