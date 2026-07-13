import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { ClaimResult, DailyRewardItem } from "@/lib/daily-reward/types";

export type ListRewardsRequest = Record<string, never>;
export type ListRewardsResponse = { items: DailyRewardItem[] };
export type GetClaimStatusRequest = { account_id: string };
export type GetClaimStatusResponse = { claimed_today: boolean; claimed_item_id: string; claimed_item_title: string };
export type ClaimRewardRequest = { account_id: string; reward_item_id: string };
export type ClaimRewardResponse = { result: ClaimResult };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type DailyRewardClient = {
  ListRewards(req: ListRewardsRequest, cb: Cb<ListRewardsResponse>): void;
  GetClaimStatus(req: GetClaimStatusRequest, cb: Cb<GetClaimStatusResponse>): void;
  Claim(req: ClaimRewardRequest, cb: Cb<ClaimRewardResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      DailyRewardService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => DailyRewardClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: DailyRewardClient | undefined;

export function dailyRewardClient(): DailyRewardClient {
  if (!client) {
    client = new proto.web.v1.DailyRewardService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function dailyRewardRpc(method: "ListRewards", req: ListRewardsRequest): Promise<ListRewardsResponse>;
export function dailyRewardRpc(method: "GetClaimStatus", req: GetClaimStatusRequest): Promise<GetClaimStatusResponse>;
export function dailyRewardRpc(method: "Claim", req: ClaimRewardRequest): Promise<ClaimRewardResponse>;
export function dailyRewardRpc(method: keyof DailyRewardClient, req: unknown): Promise<unknown> {
  const c = dailyRewardClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
