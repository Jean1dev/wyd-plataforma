// Pure NPC domain types shared between server (gRPC client) and client
// components. Keep this module free of "server-only" so the browser can import
// it for props/state typing.

export type AdminResult =
  | "ADMIN_RESULT_UNSPECIFIED"
  | "ADMIN_RESULT_OK"
  | "ADMIN_RESULT_FORBIDDEN"
  | "ADMIN_RESULT_INVALID"
  | "ADMIN_RESULT_NOT_FOUND"
  // DeleteNpc refused because the NPC is content-owned (see AdminNpc.origin).
  | "ADMIN_RESULT_CONTENT_OWNED";

export type AdminNpcShopItem = {
  slot: number;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
  quantity: number;
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
  // "content" = imported from NPCGener.txt by `dbserver import-npcs` (versioned
  // game content, cannot be deleted — only hidden); "custom" = created by a
  // moderator through UpsertNpc.
  origin: string;
  generator_index: number;
};

// Lookup entries that back the form pickers. Empty lists are valid (web-api
// without -content) — the UI degrades to manual fields.
export type MerchantTemplate = {
  template_name: string;
  display_name: string;
  merchant: number;
};

// One row of Release/Common/ItemList.csv. Fields beyond name are the *visual*
// key: the game client draws an item from (mesh, texture, nPos), never from
// item_index, so an icon pack is keyed by icon_key. See docs/item-icons.md.
// Both ItemCatalogService.ListItems and NpcAdminService.ListItemCatalog return
// this same message (shared mapper server-side), so they cannot diverge.
export type ItemCatalogEntry = {
  item_index: number;
  /** Raw catalog name, e.g. "Botas_Douradas(N)". Use for matching, not display. */
  name: string;
  /** Icon-pack key, "m<mesh>_t<texture>_p<slot_mask>". Opaque — never parse it. */
  icon_key: string;
  /** `name` with underscores turned back into spaces. This is what you show. */
  display_name: string;
  /** nPos bitmask over STRUCT_MOB.Equip[16]; 0 = not equippable. */
  slot_mask: number;
  /** slot_mask already decoded ("boots", "weapon", …) — don't redo the bits. */
  slots: string[];
  /** 1=Normal 2=Místico 3=Arcano 4=Lendário … */
  grade: number;
  mesh: number;
  texture: number;
};

export type MapZone = {
  id: number;
  name: string;
};

// Global price override. Item absent from a ListItemPrices response has no
// override — the game catalog's base price applies.
export type ItemPrice = {
  item_index: number;
  price: number;
};

export type DropItemMob = {
  template_name: string;
  mob_name: string;
  mob_level: number;
  slot: number;
  rate_divisor: number;
};

export type DropItemEntry = {
  item_index: number;
  item_name: string;
  mobs: DropItemMob[];
};

export type MobDropItem = {
  slot: number;
  item_index: number;
  item_name: string;
  rate_divisor: number;
};

export type MobDropEntry = {
  template_name: string;
  mob_name: string;
  mob_level: number;
  items: MobDropItem[];
};

// Outcome of a form-picker lookup, so the UI can explain WHY a picker is missing
// instead of silently showing a blank manual field:
//  - "ok"          → non-empty list, render the picker
//  - "empty"       → RPC returned OK but empty (web-api started without -content)
//  - "unavailable" → gRPC/HTTP failure (web-api down, or RPC not implemented yet)
export type LookupStatus = "ok" | "empty" | "unavailable";
export type LookupResult<T> = { status: LookupStatus; data: T[] };
