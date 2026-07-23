import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { AdminMobTemplateEquipItem, AdminMobTemplateStat, AdminResult, MobTemplateFile } from "@/lib/mob-template/types";

export type { AdminMobTemplateEquipItem, AdminMobTemplateStat, AdminResult, MobTemplateFile } from "@/lib/mob-template/types";

export type LookupRequest = { moderator_id: string };
export type ListMobTemplatesResponse = { result: AdminResult; templates: MobTemplateFile[] };

export type GetMobTemplateStatRequest = { moderator_id: string; template_name: string };
export type GetMobTemplateStatResponse = { result: AdminResult; stat?: AdminMobTemplateStat };

export type UpsertMobTemplateStatRequest = { moderator_id: string; stat: AdminMobTemplateStat };

export type SetMobTemplateEquipRequest = {
  moderator_id: string;
  template_name: string;
  items: AdminMobTemplateEquipItem[];
};

export type DeleteMobTemplateStatRequest = { moderator_id: string; template_name: string };

export type AdminAck = { result: AdminResult };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type MobTemplateAdminClient = {
  ListMobTemplates(req: LookupRequest, cb: Cb<ListMobTemplatesResponse>): void;
  GetMobTemplateStat(req: GetMobTemplateStatRequest, cb: Cb<GetMobTemplateStatResponse>): void;
  UpsertMobTemplateStat(req: UpsertMobTemplateStatRequest, cb: Cb<AdminAck>): void;
  SetMobTemplateEquip(req: SetMobTemplateEquipRequest, cb: Cb<AdminAck>): void;
  DeleteMobTemplateStat(req: DeleteMobTemplateStatRequest, cb: Cb<AdminAck>): void;
};

type WebProto = {
  web: {
    v1: {
      MobTemplateAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => MobTemplateAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: MobTemplateAdminClient | undefined;

export function mobTemplateAdminClient(): MobTemplateAdminClient {
  if (!client) {
    client = new proto.web.v1.MobTemplateAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

// Typed promise wrapper. gRPC rejects (reject) are always infrastructure
// failures — the caller maps them to 502. Business outcomes travel in
// res.result via AdminResult.
export function mobTemplateAdminRpc(method: "ListMobTemplates", req: LookupRequest): Promise<ListMobTemplatesResponse>;
export function mobTemplateAdminRpc(method: "GetMobTemplateStat", req: GetMobTemplateStatRequest): Promise<GetMobTemplateStatResponse>;
export function mobTemplateAdminRpc(method: "UpsertMobTemplateStat", req: UpsertMobTemplateStatRequest): Promise<AdminAck>;
export function mobTemplateAdminRpc(method: "SetMobTemplateEquip", req: SetMobTemplateEquipRequest): Promise<AdminAck>;
export function mobTemplateAdminRpc(method: "DeleteMobTemplateStat", req: DeleteMobTemplateStatRequest): Promise<AdminAck>;
export function mobTemplateAdminRpc(method: keyof MobTemplateAdminClient, req: unknown): Promise<unknown> {
  const c = mobTemplateAdminClient();

  return new Promise((resolve, reject) => {
    // Each method has the same (req, cb) shape; the overloads above keep call
    // sites type-safe.
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
