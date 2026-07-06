import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type {
  AdminNpc,
  AdminNpcShopItem,
  AdminResult,
  ItemCatalogEntry,
  MapZone,
  MerchantTemplate,
} from "@/lib/npc/types";

export type {
  AdminNpc,
  AdminNpcShopItem,
  AdminResult,
  ItemCatalogEntry,
  MapZone,
  MerchantTemplate,
} from "@/lib/npc/types";

export type ListNpcsRequest = { moderator_id: string };
export type ListNpcsResponse = { result: AdminResult; npcs: AdminNpc[] };

export type GetNpcRequest = { moderator_id: string; npc_id: string };
export type GetNpcResponse = { result: AdminResult; npc?: AdminNpc };

export type UpsertNpcRequest = {
  moderator_id: string;
  slug: string;
  template_name: string;
  display_name: string;
  enabled: boolean;
  map_id: number;
  pos_x: number;
  pos_y: number;
  route_type: number;
  merchant: number;
};
export type UpsertNpcResponse = { result: AdminResult; npc_id: string };

export type SetNpcVisibilityRequest = { moderator_id: string; npc_id: string; enabled: boolean };
export type SetNpcShopRequest = { moderator_id: string; npc_id: string; items: AdminNpcShopItem[] };
export type SetItemPriceRequest = { moderator_id: string; item_index: number; price: number };
export type DeleteNpcRequest = { moderator_id: string; npc_id: string };

export type AdminAck = { result: AdminResult };

export type LookupRequest = { moderator_id: string };
export type ListMerchantTemplatesResponse = { result: AdminResult; templates: MerchantTemplate[] };
export type ListItemCatalogResponse = { result: AdminResult; items: ItemCatalogEntry[] };
export type ListMapZonesResponse = { result: AdminResult; zones: MapZone[] };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type NpcAdminClient = {
  ListNpcs(req: ListNpcsRequest, cb: Cb<ListNpcsResponse>): void;
  GetNpc(req: GetNpcRequest, cb: Cb<GetNpcResponse>): void;
  UpsertNpc(req: UpsertNpcRequest, cb: Cb<UpsertNpcResponse>): void;
  SetNpcVisibility(req: SetNpcVisibilityRequest, cb: Cb<AdminAck>): void;
  SetNpcShop(req: SetNpcShopRequest, cb: Cb<AdminAck>): void;
  SetItemPrice(req: SetItemPriceRequest, cb: Cb<AdminAck>): void;
  DeleteNpc(req: DeleteNpcRequest, cb: Cb<AdminAck>): void;
  ListMerchantTemplates(req: LookupRequest, cb: Cb<ListMerchantTemplatesResponse>): void;
  ListItemCatalog(req: LookupRequest, cb: Cb<ListItemCatalogResponse>): void;
  ListMapZones(req: LookupRequest, cb: Cb<ListMapZonesResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      NpcAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => NpcAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: NpcAdminClient | undefined;

export function npcAdminClient(): NpcAdminClient {
  if (!client) {
    client = new proto.web.v1.NpcAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

// Typed promise wrapper. gRPC rejects (reject) are always infrastructure
// failures — the caller maps them to 502. Business outcomes travel in
// res.result via AdminResult.
export function npcAdminRpc(method: "ListNpcs", req: ListNpcsRequest): Promise<ListNpcsResponse>;
export function npcAdminRpc(method: "GetNpc", req: GetNpcRequest): Promise<GetNpcResponse>;
export function npcAdminRpc(method: "UpsertNpc", req: UpsertNpcRequest): Promise<UpsertNpcResponse>;
export function npcAdminRpc(method: "SetNpcVisibility", req: SetNpcVisibilityRequest): Promise<AdminAck>;
export function npcAdminRpc(method: "SetNpcShop", req: SetNpcShopRequest): Promise<AdminAck>;
export function npcAdminRpc(method: "SetItemPrice", req: SetItemPriceRequest): Promise<AdminAck>;
export function npcAdminRpc(method: "DeleteNpc", req: DeleteNpcRequest): Promise<AdminAck>;
export function npcAdminRpc(method: "ListMerchantTemplates", req: LookupRequest): Promise<ListMerchantTemplatesResponse>;
export function npcAdminRpc(method: "ListItemCatalog", req: LookupRequest): Promise<ListItemCatalogResponse>;
export function npcAdminRpc(method: "ListMapZones", req: LookupRequest): Promise<ListMapZonesResponse>;
export function npcAdminRpc(method: keyof NpcAdminClient, req: unknown): Promise<unknown> {
  const c = npcAdminClient();

  return new Promise((resolve, reject) => {
    // Each method has the same (req, cb) shape; the overloads above keep call
    // sites type-safe.
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
