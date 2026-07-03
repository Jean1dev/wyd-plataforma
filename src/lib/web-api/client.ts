import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

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

const pkgDef = protoLoader.loadSync(path.join(process.cwd(), "proto/web.proto"), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
});

const proto = grpc.loadPackageDefinition(pkgDef) as unknown as WebProto;

function credentials(): grpc.ChannelCredentials {
  if (process.env.WEB_API_INSECURE === "1") {
    return grpc.credentials.createInsecure();
  }

  // mTLS only when a client cert is configured (direct link to webserver, e.g.
  // local docker-compose.mtls). Behind Railway's public HTTPS edge there's no
  // client cert to present — the edge terminates TLS with its own public cert.
  if (process.env.WEB_API_CA || process.env.WEB_API_CLIENT_KEY || process.env.WEB_API_CLIENT_CRT) {
    return grpc.credentials.createSsl(
      readFileSync(requiredEnv("WEB_API_CA")),
      readFileSync(requiredEnv("WEB_API_CLIENT_KEY")),
      readFileSync(requiredEnv("WEB_API_CLIENT_CRT")),
    );
  }

  return grpc.credentials.createSsl();
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let client: AccountClient | undefined;

export function accountClient(): AccountClient {
  if (!client) {
    const options: grpc.ChannelOptions = process.env.WEB_API_SERVER_NAME
      ? { "grpc.ssl_target_name_override": process.env.WEB_API_SERVER_NAME }
      : {};

    client = new proto.web.v1.AccountWebService(
      process.env.WEB_API_ADDR ?? "localhost:7600",
      credentials(),
      options,
    );
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
