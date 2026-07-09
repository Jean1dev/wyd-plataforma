import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";

export type CharacterSummary = {
  slot: number;
  name: string;
  class: Buffer;
  level: number;
  exp: string;
  coin: string;
  hp: number;
  max_hp: number;
  mp: number;
  max_mp: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  constitution: number;
};

export type ListMyCharactersRequest = { account_id: string };
export type ListMyCharactersResponse = { characters: CharacterSummary[] };

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type CharacterClient = {
  ListMyCharacters(req: ListMyCharactersRequest, cb: Cb<ListMyCharactersResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      CharacterWebService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => CharacterClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: CharacterClient | undefined;

export function characterClient(): CharacterClient {
  if (!client) {
    client = new proto.web.v1.CharacterWebService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function characterRpc(
  method: "ListMyCharacters",
  req: ListMyCharactersRequest,
): Promise<ListMyCharactersResponse> {
  const c = characterClient();

  return new Promise((resolve, reject) => {
    c[method](req, (err, res) => (err ? reject(err) : resolve(res)));
  });
}
