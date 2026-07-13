import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { AdminResult, DonateShopItem } from "@/lib/donate/types";

export type { AdminResult, DonateShopItem } from "@/lib/donate/types";

export type ListDonateShopItemsRequest = { moderator_id: string };
export type ListDonateShopItemsResponse = { result: AdminResult; items: DonateShopItem[] };
export type UpsertDonateShopItemRequest = { moderator_id: string; item: DonateShopItem };
export type UpsertDonateShopItemResponse = { result: AdminResult; item_id: string };
export type SetDonateShopItemEnabledRequest = { moderator_id: string; item_id: string; enabled: boolean };
export type DeleteDonateShopItemRequest = { moderator_id: string; item_id: string };
export type CreditDonateBalanceRequest = {
  moderator_id: string;
  account_id: string;
  amount: number;
  reason: string;
};
export type CreditDonateBalanceResponse = { result: AdminResult; new_balance: string };
export type AdminAck = { result: AdminResult };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type DonateAdminClient = {
  ListShopItems(req: ListDonateShopItemsRequest, cb: Cb<ListDonateShopItemsResponse>): void;
  UpsertShopItem(req: UpsertDonateShopItemRequest, cb: Cb<UpsertDonateShopItemResponse>): void;
  SetShopItemEnabled(req: SetDonateShopItemEnabledRequest, cb: Cb<AdminAck>): void;
  DeleteShopItem(req: DeleteDonateShopItemRequest, cb: Cb<AdminAck>): void;
  CreditDonateBalance(req: CreditDonateBalanceRequest, cb: Cb<CreditDonateBalanceResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      DonateAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => DonateAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: DonateAdminClient | undefined;

export function donateAdminClient(): DonateAdminClient {
  if (!client) {
    client = new proto.web.v1.DonateAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function donateAdminRpc(
  method: "ListShopItems",
  req: ListDonateShopItemsRequest,
): Promise<ListDonateShopItemsResponse>;
export function donateAdminRpc(
  method: "UpsertShopItem",
  req: UpsertDonateShopItemRequest,
): Promise<UpsertDonateShopItemResponse>;
export function donateAdminRpc(method: "SetShopItemEnabled", req: SetDonateShopItemEnabledRequest): Promise<AdminAck>;
export function donateAdminRpc(method: "DeleteShopItem", req: DeleteDonateShopItemRequest): Promise<AdminAck>;
export function donateAdminRpc(
  method: "CreditDonateBalance",
  req: CreditDonateBalanceRequest,
): Promise<CreditDonateBalanceResponse>;
export function donateAdminRpc(method: keyof DonateAdminClient, req: unknown): Promise<unknown> {
  const c = donateAdminClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
