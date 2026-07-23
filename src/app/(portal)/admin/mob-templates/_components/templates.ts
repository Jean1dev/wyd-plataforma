"use client";

import { useEffect, useState } from "react";
import type { MobTemplateFile } from "@/lib/mob-template/types";
// LookupStatus is a generic picker-degradation status, not NPC-specific —
// reused as-is rather than redefined per feature.
import type { LookupStatus } from "@/lib/npc/types";

export type MobTemplateCatalogState = {
  templates: MobTemplateFile[];
  loading: boolean;
  // "ok" → picker ready; "empty" → web-api without -content; "unavailable" → fetch failed.
  status: LookupStatus;
  available: boolean;
};

type CatalogLoad = { templates: MobTemplateFile[]; status: LookupStatus };

// ListMobTemplates returns every npc/ file (unfiltered), so — like the item
// catalog — we fetch it once and share the promise between every combobox
// instance on the page instead of re-fetching per component.
let cache: Promise<CatalogLoad> | undefined;

function loadMobTemplateCatalog(): Promise<CatalogLoad> {
  if (!cache) {
    cache = fetch("/api/admin/mob-templates")
      .then(async (res) => {
        if (!res.ok) {
          cache = undefined;
          return { templates: [], status: "unavailable" as LookupStatus };
        }
        const data = (await res.json()) as { templates?: MobTemplateFile[] };
        const templates = data.templates ?? [];
        return { templates, status: (templates.length > 0 ? "ok" : "empty") as LookupStatus };
      })
      .catch(() => {
        cache = undefined;
        return { templates: [], status: "unavailable" as LookupStatus };
      });
  }
  return cache;
}

export function useMobTemplateCatalog(): MobTemplateCatalogState {
  const [state, setState] = useState<MobTemplateCatalogState>({
    templates: [],
    loading: true,
    status: "empty",
    available: false,
  });

  useEffect(() => {
    let active = true;
    loadMobTemplateCatalog().then(({ templates, status }) => {
      if (active) setState({ templates, loading: false, status, available: status === "ok" });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
