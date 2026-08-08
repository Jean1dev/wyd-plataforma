import "server-only";

import * as grpc from "@grpc/grpc-js";
import { channelOptions, credentials, webApiAddress, webProtoPackage } from "./channel";
import type {
  AccountSummary,
  AdminResult,
  DonateLedgerAction,
  DonateLedgerRow,
  PaymentMethod,
  RevenueBucket,
  RevenueByMethod,
  RevenuePoint,
  RevenueTotals,
  RevenueWindow,
  TopBuyerRow,
  TopupOrderRow,
  TopupStatus,
} from "@/lib/revenue/types";

export type * from "@/lib/revenue/types";

export type GetRevenueSummaryRequest = {
  moderator_id: string;
  window: RevenueWindow;
  bucket: RevenueBucket;
  account_id: string;
};
export type GetRevenueSummaryResponse = {
  result: AdminResult;
  totals: RevenueTotals;
  by_method: RevenueByMethod[];
  series: RevenuePoint[];
  from_unix: string;
  to_unix: string;
};

export type ListTopupOrdersRequest = {
  moderator_id: string;
  window: RevenueWindow;
  status: TopupStatus;
  payment_method: PaymentMethod;
  account_id: string;
  limit: number;
  offset: number;
};
export type ListTopupOrdersResponse = {
  result: AdminResult;
  orders: TopupOrderRow[];
  total_count: number;
  from_unix: string;
  to_unix: string;
};

export type ListTopBuyersRequest = {
  moderator_id: string;
  window: RevenueWindow;
  limit: number;
  offset: number;
};
export type ListTopBuyersResponse = {
  result: AdminResult;
  buyers: TopBuyerRow[];
  total_count: number;
  from_unix: string;
  to_unix: string;
};

export type ListDonateSpendRequest = {
  moderator_id: string;
  window: RevenueWindow;
  action: DonateLedgerAction;
  account_id: string;
  limit: number;
  offset: number;
};
export type ListDonateSpendResponse = {
  result: AdminResult;
  entries: DonateLedgerRow[];
  total_count: number;
  from_unix: string;
  to_unix: string;
};

export type SearchAccountsRequest = {
  moderator_id: string;
  name_prefix: string;
  limit: number;
};
export type SearchAccountsResponse = {
  result: AdminResult;
  accounts: AccountSummary[];
};

type Cb<R> = (err: grpc.ServiceError | null, res: R) => void;

type RevenueAdminClient = {
  GetRevenueSummary(req: GetRevenueSummaryRequest, cb: Cb<GetRevenueSummaryResponse>): void;
  ListTopupOrders(req: ListTopupOrdersRequest, cb: Cb<ListTopupOrdersResponse>): void;
  ListTopBuyers(req: ListTopBuyersRequest, cb: Cb<ListTopBuyersResponse>): void;
  ListDonateSpend(req: ListDonateSpendRequest, cb: Cb<ListDonateSpendResponse>): void;
  SearchAccounts(req: SearchAccountsRequest, cb: Cb<SearchAccountsResponse>): void;
};

type WebProto = {
  web: {
    v1: {
      DonateRevenueAdminService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
        options?: grpc.ChannelOptions,
      ) => RevenueAdminClient;
    };
  };
};

const proto = webProtoPackage as unknown as WebProto;

let client: RevenueAdminClient | undefined;

export function revenueAdminClient(): RevenueAdminClient {
  if (!client) {
    client = new proto.web.v1.DonateRevenueAdminService(webApiAddress(), credentials(), channelOptions());
  }

  return client;
}

export function revenueAdminRpc(
  method: "GetRevenueSummary",
  req: GetRevenueSummaryRequest,
): Promise<GetRevenueSummaryResponse>;
export function revenueAdminRpc(
  method: "ListTopupOrders",
  req: ListTopupOrdersRequest,
): Promise<ListTopupOrdersResponse>;
export function revenueAdminRpc(method: "ListTopBuyers", req: ListTopBuyersRequest): Promise<ListTopBuyersResponse>;
export function revenueAdminRpc(
  method: "ListDonateSpend",
  req: ListDonateSpendRequest,
): Promise<ListDonateSpendResponse>;
export function revenueAdminRpc(method: "SearchAccounts", req: SearchAccountsRequest): Promise<SearchAccountsResponse>;
export function revenueAdminRpc(method: keyof RevenueAdminClient, req: unknown): Promise<unknown> {
  const c = revenueAdminClient();

  return new Promise((resolve, reject) => {
    (c[method] as (r: unknown, cb: Cb<unknown>) => void).call(c, req, (err, res) =>
      err ? reject(err) : resolve(res),
    );
  });
}
