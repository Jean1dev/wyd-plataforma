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
