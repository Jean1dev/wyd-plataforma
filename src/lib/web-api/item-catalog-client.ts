import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { ItemCatalogEntry } from "@/lib/npc/types";

// ItemCatalogService is the only web-api service that carries no identity: the
// item catalog is public, immutable content read from the read-only Release/
// mount at boot — not account data. So there is no account_id/moderator_id here
// and no AdminResult; an empty `items` list is the valid degraded response when
// web-api runs without -content/W2PP_CONTENT.

export type ListItemsRequest = Record<string, never>;
export type ListItemsResponse = { items: ItemCatalogEntry[]; catalog_version: string };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type ItemCatalogClient = {
  ListItems(req: ListItemsRequest, cb: Cb<ListItemsResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      ItemCatalogService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => ItemCatalogClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: ItemCatalogClient | undefined;

export function itemCatalogClient(): ItemCatalogClient {
  if (!client) {
    client = new proto.web.v1.ItemCatalogService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function itemCatalogRpc(method: "ListItems", req: ListItemsRequest): Promise<ListItemsResponse>;
export function itemCatalogRpc(method: keyof ItemCatalogClient, req: unknown): Promise<unknown> {
  const c = itemCatalogClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
