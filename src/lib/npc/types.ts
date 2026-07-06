// Pure NPC domain types shared between server (gRPC client) and client
// components. Keep this module free of "server-only" so the browser can import
// it for props/state typing.

export type AdminResult =
  | "ADMIN_RESULT_UNSPECIFIED"
  | "ADMIN_RESULT_OK"
  | "ADMIN_RESULT_FORBIDDEN"
  | "ADMIN_RESULT_INVALID"
  | "ADMIN_RESULT_NOT_FOUND";

export type AdminNpcShopItem = {
  slot: number;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
};

export type AdminNpc = {
  id: string;
  slug: string;
  template_name: string;
  display_name: string;
  enabled: boolean;
  map_id: number;
  pos_x: number;
  pos_y: number;
  route_type: number;
  merchant: number;
  shop: AdminNpcShopItem[];
};

// Lookup entries that back the form pickers. Empty lists are valid (web-api
// without -content) — the UI degrades to manual fields.
export type MerchantTemplate = {
  template_name: string;
  display_name: string;
  merchant: number;
};

export type ItemCatalogEntry = {
  item_index: number;
  name: string;
};

export type MapZone = {
  id: number;
  name: string;
};

// Outcome of a form-picker lookup, so the UI can explain WHY a picker is missing
// instead of silently showing a blank manual field:
//  - "ok"          → non-empty list, render the picker
//  - "empty"       → RPC returned OK but empty (web-api started without -content)
//  - "unavailable" → gRPC/HTTP failure (web-api down, or RPC not implemented yet)
export type LookupStatus = "ok" | "empty" | "unavailable";
export type LookupResult<T> = { status: LookupStatus; data: T[] };
