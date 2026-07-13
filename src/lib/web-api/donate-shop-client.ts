import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { BuyResult, DonateShopItem } from "@/lib/donate/types";

export type ListPublicShopItemsRequest = Record<string, never>;
export type ListPublicShopItemsResponse = { items: DonateShopItem[] };
export type GetDonateBalanceRequest = { account_id: string };
export type GetDonateBalanceResponse = { balance: string };
export type BuyDonateShopItemRequest = { account_id: string; shop_item_id: string };
export type BuyDonateShopItemResponse = { result: BuyResult; new_balance: string };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type DonateShopClient = {
  ListShopItems(req: ListPublicShopItemsRequest, cb: Cb<ListPublicShopItemsResponse>): void;
  GetBalance(req: GetDonateBalanceRequest, cb: Cb<GetDonateBalanceResponse>): void;
  Buy(req: BuyDonateShopItemRequest, cb: Cb<BuyDonateShopItemResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      DonateShopService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => DonateShopClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: DonateShopClient | undefined;

export function donateShopClient(): DonateShopClient {
  if (!client) {
    client = new proto.web.v1.DonateShopService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function donateShopRpc(
  method: "ListShopItems",
  req: ListPublicShopItemsRequest,
): Promise<ListPublicShopItemsResponse>;
export function donateShopRpc(method: "GetBalance", req: GetDonateBalanceRequest): Promise<GetDonateBalanceResponse>;
export function donateShopRpc(method: "Buy", req: BuyDonateShopItemRequest): Promise<BuyDonateShopItemResponse>;
export function donateShopRpc(method: keyof DonateShopClient, req: unknown): Promise<unknown> {
  const c = donateShopClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
