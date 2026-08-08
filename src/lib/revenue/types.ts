// Wire types for web.v1.DonateRevenueAdminService, mirroring proto/web.proto.
//
// channel.ts loads the proto with { keepCase: true, longs: String, enums: String,
// defaults: true }, so: field names stay snake_case, every int64 arrives as a
// JS string, every int32 as a number, and every enum as its full proto value
// name. Deviating from that here is a silent type-vs-wire mismatch.

import type { AdminResult, PaymentMethod, TopupStatus } from "@/lib/donate/types";

export type { AdminResult, PaymentMethod, TopupStatus } from "@/lib/donate/types";

export type RevenueBucket =
  | "REVENUE_BUCKET_UNSPECIFIED"
  | "REVENUE_BUCKET_DAY"
  | "REVENUE_BUCKET_WEEK"
  | "REVENUE_BUCKET_MONTH";

export type DonateLedgerAction =
  | "DONATE_LEDGER_ACTION_UNSPECIFIED"
  | "DONATE_LEDGER_ACTION_PURCHASE"
  | "DONATE_LEDGER_ACTION_CREDIT";

// Half-open [from_unix, to_unix). "0"/"0" means the server applies its own
// default (the last 30 days ending now).
export type RevenueWindow = {
  from_unix: string;
  to_unix: string;
};

export type RevenueTotals = {
  paid_orders: string;
  gross_cents: string;
  credits_sold: string;
  distinct_buyers: string;

  created_orders: string;
  pending_orders: string;
  pending_cents: string;

  shop_purchases: string;
  credits_spent: string;
  manual_credits: string;
  credits_granted: string;
};

export type RevenueByMethod = {
  payment_method: PaymentMethod;
  paid_orders: string;
  gross_cents: string;
};

export type RevenuePoint = {
  bucket_start_unix: string;
  paid_orders: string;
  gross_cents: string;
  credits_sold: string;
  distinct_buyers: string;
};

export type TopupOrderRow = {
  id: string;
  external_reference: string;
  account_id: string;
  account_name: string;
  account_email: string;
  payer_name: string;
  payer_cpf_masked: string;
  credits: number;
  amount_cents: string;
  payment_method: PaymentMethod;
  // Always empty — nothing writes donate_topup_order.provider. Not exposed.
  provider: string;
  status: TopupStatus;
  created_at_unix: string;
  confirmed_at_unix: string;
};

export type TopBuyerRow = {
  account_id: string;
  account_name: string;
  account_email: string;
  window_paid_orders: string;
  window_gross_cents: string;
  lifetime_paid_orders: string;
  lifetime_gross_cents: string;
  lifetime_credits: string;
  first_paid_at_unix: string;
  last_paid_at_unix: string;
  donate_balance: number;
};

export type DonateLedgerRow = {
  id: string;
  action: DonateLedgerAction;
  created_at_unix: string;
  subject_account_id: string;
  subject_account_name: string;
  actor_account_id: string;
  actor_account_name: string;
  credits_delta: string;
  balance_after: string;
  shop_item_id: string;
  shop_item_title: string;
  reason: string;
};

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  donate_balance: number;
  role: string;
  is_blocked: boolean;
};

export type RevenueAck = { result: AdminResult };
