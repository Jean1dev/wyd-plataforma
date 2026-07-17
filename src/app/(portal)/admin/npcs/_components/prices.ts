"use client";

import { useEffect, useState } from "react";
import type { ItemPrice, LookupStatus } from "@/lib/npc/types";

export type PricesState = {
  prices: ItemPrice[];
  loading: boolean;
  // "ok" → table has overrides to show; "empty" → no overrides currently set;
  // "unavailable" → fetch failed (web-api down or RPC not implemented yet).
  status: LookupStatus;
  /** Convenience: status === "ok". */
  available: boolean;
  /** Forces a refetch — call after invalidateItemPriceCache(). */
  refresh: () => void;
};

type PricesLoad = { prices: ItemPrice[]; status: LookupStatus };

// Shared across every PriceEditor instance, same caching approach as
// catalog.ts's loadItemCatalog. Invalidated after a successful write so the
// overrides table reflects the change without a full page reload.
let cache: Promise<PricesLoad> | undefined;

export function invalidateItemPriceCache(): void {
  cache = undefined;
}

function loadItemPrices(): Promise<PricesLoad> {
  if (!cache) {
    cache = fetch("/api/admin/item-prices")
      .then(async (res) => {
        if (!res.ok) {
          cache = undefined;
          return { prices: [], status: "unavailable" as LookupStatus };
        }
        const data = (await res.json()) as { prices?: ItemPrice[] };
        const prices = data.prices ?? [];
        return { prices, status: (prices.length > 0 ? "ok" : "empty") as LookupStatus };
      })
      .catch(() => {
        cache = undefined;
        return { prices: [], status: "unavailable" as LookupStatus };
      });
  }
  return cache;
}

export function usePriceOverrides(): PricesState {
  const [{ prices, loading, status, available }, setState] = useState<Omit<PricesState, "refresh">>({
    prices: [],
    loading: true,
    status: "empty",
    available: false,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    loadItemPrices().then(({ prices, status }) => {
      if (active) setState({ prices, loading: false, status, available: status === "ok" });
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return {
    prices,
    loading,
    status,
    available,
    refresh: () => {
      invalidateItemPriceCache();
      setReloadKey((k) => k + 1);
    },
  };
}
