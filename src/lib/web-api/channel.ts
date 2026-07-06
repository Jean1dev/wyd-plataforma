import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function credentials(): grpc.ChannelCredentials {
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

export function channelOptions(): grpc.ChannelOptions {
  return process.env.WEB_API_SERVER_NAME
    ? { "grpc.ssl_target_name_override": process.env.WEB_API_SERVER_NAME }
    : {};
}

export function webApiAddress(): string {
  return process.env.WEB_API_ADDR ?? "localhost:7600";
}

// The web.proto package definition is shared by every service client.
export const webProtoPackage = grpc.loadPackageDefinition(
  protoLoader.loadSync(path.join(process.cwd(), "proto/web.proto"), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
  }),
);
