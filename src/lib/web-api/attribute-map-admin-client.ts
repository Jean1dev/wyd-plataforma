import "server-only";

import * as grpc from "@grpc/grpc-js";
import type {
  AdminResult,
  AttributeMapInfo,
  AttributeMapRect,
  AttributeMapTransformFilter,
  AttributeMapTransformOperation,
  AttributeMapValueCount,
} from "@/lib/attribute-map/types";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";

type GrpcValueCount = Omit<AttributeMapValueCount, "count"> & { count: string | number };

type GrpcAttributeMapInfo = Omit<AttributeMapInfo, "worldScale" | "histogram"> & {
  world_scale: number;
  histogram: GrpcValueCount[];
};

export type GetAttributeMapInfoRequest = { moderator_id: string };
export type GetAttributeMapInfoResponse = {
  result: AdminResult;
  info?: GrpcAttributeMapInfo;
};

export type TransformAttributeMapRequest = {
  moderator_id: string;
  operation: AttributeMapTransformOperation;
  operand: number;
  rect?: AttributeMapRect;
  filter?: AttributeMapTransformFilter;
};

export type TransformAttributeMapResponse = {
  result: AdminResult;
  changed_count: number;
  before_histogram: GrpcValueCount[];
  after_histogram: GrpcValueCount[];
  original_sha256: string;
  new_sha256: string;
  filename: string;
  data?: Buffer | Uint8Array | string;
};

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type AttributeMapAdminClient = {
  GetAttributeMapInfo(req: GetAttributeMapInfoRequest, cb: Cb<GetAttributeMapInfoResponse>): void;
  TransformAttributeMap(req: TransformAttributeMapRequest, cb: Cb<TransformAttributeMapResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      AttributeMapAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => AttributeMapAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: AttributeMapAdminClient | undefined;

export function attributeMapAdminClient(): AttributeMapAdminClient {
  if (!client) {
    client = new proto.web.v1.AttributeMapAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function attributeMapAdminRpc(
  method: "GetAttributeMapInfo",
  req: GetAttributeMapInfoRequest,
): Promise<GetAttributeMapInfoResponse>;
export function attributeMapAdminRpc(
  method: "TransformAttributeMap",
  req: TransformAttributeMapRequest,
): Promise<TransformAttributeMapResponse>;
export function attributeMapAdminRpc(method: keyof AttributeMapAdminClient, req: unknown): Promise<unknown> {
  const c = attributeMapAdminClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
