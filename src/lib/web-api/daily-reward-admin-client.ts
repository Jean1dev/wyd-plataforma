import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { AdminResult } from "./npc-admin-client";
import type { DailyRewardItem } from "@/lib/daily-reward/types";

export type ListRewardItemsRequest = { moderator_id: string };
export type ListRewardItemsResponse = { result: AdminResult; items: DailyRewardItem[] };
export type UpsertRewardItemRequest = { moderator_id: string; item: DailyRewardItem };
export type UpsertRewardItemResponse = { result: AdminResult; item_id: string };
export type SetRewardItemEnabledRequest = { moderator_id: string; item_id: string; enabled: boolean };
export type DeleteRewardItemRequest = { moderator_id: string; item_id: string };
export type AdminAck = { result: AdminResult };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type DailyRewardAdminClient = {
  ListRewardItems(req: ListRewardItemsRequest, cb: Cb<ListRewardItemsResponse>): void;
  UpsertRewardItem(req: UpsertRewardItemRequest, cb: Cb<UpsertRewardItemResponse>): void;
  SetRewardItemEnabled(req: SetRewardItemEnabledRequest, cb: Cb<AdminAck>): void;
  DeleteRewardItem(req: DeleteRewardItemRequest, cb: Cb<AdminAck>): void;
};

type WebProto = {
  web: {
    v1: {
      DailyRewardAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => DailyRewardAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: DailyRewardAdminClient | undefined;

export function dailyRewardAdminClient(): DailyRewardAdminClient {
  if (!client) {
    client = new proto.web.v1.DailyRewardAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function dailyRewardAdminRpc(
  method: "ListRewardItems",
  req: ListRewardItemsRequest,
): Promise<ListRewardItemsResponse>;
export function dailyRewardAdminRpc(
  method: "UpsertRewardItem",
  req: UpsertRewardItemRequest,
): Promise<UpsertRewardItemResponse>;
export function dailyRewardAdminRpc(method: "SetRewardItemEnabled", req: SetRewardItemEnabledRequest): Promise<AdminAck>;
export function dailyRewardAdminRpc(method: "DeleteRewardItem", req: DeleteRewardItemRequest): Promise<AdminAck>;
export function dailyRewardAdminRpc(method: keyof DailyRewardAdminClient, req: unknown): Promise<unknown> {
  const c = dailyRewardAdminClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
