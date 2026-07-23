import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { AdminResult } from "./npc-admin-client";
import type { WorldEventConfigProto } from "@/lib/world-events/types";

export type GetWorldEventConfigRequest = { moderator_id: string };
export type GetWorldEventConfigResponse = {
  result: AdminResult;
  version: string;
  config?: WorldEventConfigProto;
};
export type SetWorldEventConfigRequest = {
  moderator_id: string;
  config: WorldEventConfigProto;
};
export type AdminAck = { result: AdminResult };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type WorldEventAdminClient = {
  GetWorldEventConfig(req: GetWorldEventConfigRequest, cb: Cb<GetWorldEventConfigResponse>): void;
  SetWorldEventConfig(req: SetWorldEventConfigRequest, cb: Cb<AdminAck>): void;
};

type WebProto = {
  web: {
    v1: {
      WorldEventAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => WorldEventAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: WorldEventAdminClient | undefined;

export function worldEventAdminClient(): WorldEventAdminClient {
  if (!client) {
    client = new proto.web.v1.WorldEventAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function worldEventAdminRpc(
  method: "GetWorldEventConfig",
  req: GetWorldEventConfigRequest,
): Promise<GetWorldEventConfigResponse>;
export function worldEventAdminRpc(method: "SetWorldEventConfig", req: SetWorldEventConfigRequest): Promise<AdminAck>;
export function worldEventAdminRpc(method: keyof WorldEventAdminClient, req: unknown): Promise<unknown> {
  const c = worldEventAdminClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}

