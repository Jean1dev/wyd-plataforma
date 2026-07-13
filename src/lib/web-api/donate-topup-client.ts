import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type { AdminResult, PaymentMethod, TopupResult, TopupStatus } from "@/lib/donate/types";

export type GetPayerProfileRequest = { account_id: string };
export type GetPayerProfileResponse = { found: boolean; name: string; cpf: string };
export type SavePayerProfileRequest = { account_id: string; name: string; cpf: string };
export type SavePayerProfileResponse = { result: AdminResult };
export type CreateTopupOrderRequest = {
  account_id: string;
  external_reference: string;
  credits: number;
  amount_cents: number;
  payment_method: PaymentMethod;
};
export type CreateTopupOrderResponse = { result: AdminResult; order_id: string };
export type ConfirmTopupOrderRequest = { external_reference: string };
export type ConfirmTopupOrderResponse = { result: TopupResult; new_balance: string };
export type GetTopupOrderRequest = { external_reference: string; account_id: string };
export type GetTopupOrderResponse = { status: TopupStatus; credits: number; new_balance: string };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type DonateTopupClient = {
  GetPayerProfile(req: GetPayerProfileRequest, cb: Cb<GetPayerProfileResponse>): void;
  SavePayerProfile(req: SavePayerProfileRequest, cb: Cb<SavePayerProfileResponse>): void;
  CreateTopupOrder(req: CreateTopupOrderRequest, cb: Cb<CreateTopupOrderResponse>): void;
  ConfirmTopupOrder(req: ConfirmTopupOrderRequest, cb: Cb<ConfirmTopupOrderResponse>): void;
  GetTopupOrder(req: GetTopupOrderRequest, cb: Cb<GetTopupOrderResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      DonateTopupService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => DonateTopupClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: DonateTopupClient | undefined;

export function donateTopupClient(): DonateTopupClient {
  if (!client) {
    client = new proto.web.v1.DonateTopupService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function donateTopupRpc(method: "GetPayerProfile", req: GetPayerProfileRequest): Promise<GetPayerProfileResponse>;
export function donateTopupRpc(
  method: "SavePayerProfile",
  req: SavePayerProfileRequest,
): Promise<SavePayerProfileResponse>;
export function donateTopupRpc(
  method: "CreateTopupOrder",
  req: CreateTopupOrderRequest,
): Promise<CreateTopupOrderResponse>;
export function donateTopupRpc(
  method: "ConfirmTopupOrder",
  req: ConfirmTopupOrderRequest,
): Promise<ConfirmTopupOrderResponse>;
export function donateTopupRpc(method: "GetTopupOrder", req: GetTopupOrderRequest): Promise<GetTopupOrderResponse>;
export function donateTopupRpc(method: keyof DonateTopupClient, req: unknown): Promise<unknown> {
  const c = donateTopupClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
