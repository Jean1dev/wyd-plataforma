import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";

export type ListExpRankingRequest = {
  limit: number;
  offset: number;
};

export type RankingEntry = {
  rank: number;
  name: string;
  class: number;
  clan: number;
  guild_id: number;
  level: number;
  exp: string;
  class_master: number;
};

export type ListExpRankingResponse = {
  entries: RankingEntry[];
  total_count: number;
};

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type RankingClient = {
  ListExpRanking(req: ListExpRankingRequest, cb: Cb<ListExpRankingResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      RankingWebService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => RankingClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: RankingClient | undefined;

export function rankingClient(): RankingClient {
  if (!client) {
    client = new proto.web.v1.RankingWebService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function rankingRpc(
  method: "ListExpRanking",
  req: ListExpRankingRequest,
): Promise<ListExpRankingResponse> {
  const c = rankingClient();

  return new Promise((resolve, reject) => {
    c[method](req, (err, res) => (err ? reject(err) : resolve(res)));
  });
}
