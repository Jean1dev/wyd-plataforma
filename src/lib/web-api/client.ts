import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";

type AccountClient = {
  CreateAccount(
    req: CreateAccountRequest,
    cb: (err: grpc.ServiceError | null, res: CreateAccountResponse) => void,
  ): void;
  VerifyCredentials(
    req: VerifyCredentialsRequest,
    cb: (err: grpc.ServiceError | null, res: VerifyCredentialsResponse) => void,
  ): void;
};

export type CreateAccountRequest = {
  name: string;
  password: string;
  email: string;
};

export type CreateAccountResponse = {
  result: "CREATE_RESULT_OK" | "CREATE_RESULT_NAME_TAKEN" | "CREATE_RESULT_INVALID" | "CREATE_RESULT_UNSPECIFIED";
  account_id: string;
};

export type VerifyCredentialsRequest = {
  name: string;
  password: string;
};

export type VerifyCredentialsResponse = {
  ok: boolean;
  account_id: string;
  blocked: boolean;
  role: string;
};

type WebProto = {
  web: {
    v1: {
      AccountWebService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => AccountClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: AccountClient | undefined;

export function accountClient(): AccountClient {
  if (!client) {
    client = new proto.web.v1.AccountWebService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function rpc(method: "CreateAccount", req: CreateAccountRequest): Promise<CreateAccountResponse>;
export function rpc(method: "VerifyCredentials", req: VerifyCredentialsRequest): Promise<VerifyCredentialsResponse>;
export function rpc(
  method: "CreateAccount" | "VerifyCredentials",
  req: CreateAccountRequest | VerifyCredentialsRequest,
): Promise<CreateAccountResponse | VerifyCredentialsResponse> {
  const c = accountClient();

  return new Promise((resolve, reject) => {
    if (method === "CreateAccount") {
      c.CreateAccount(req as CreateAccountRequest, (err, res) => (err ? reject(err) : resolve(res)));
      return;
    }

    c.VerifyCredentials(req as VerifyCredentialsRequest, (err, res) => (err ? reject(err) : resolve(res)));
  });
}
