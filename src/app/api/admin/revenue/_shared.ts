import { NextResponse } from "next/server";
import type {
  AccountSummaryJson,
  DonateLedgerEntryJson,
  PeriodJson,
  RevenueByMethodJson,
  RevenuePointJson,
  RevenueTotalsJson,
  TopBuyerJson,
  TopupOrderJson,
} from "@/lib/revenue/http-types";
import type {
  AccountSummary,
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

type Parsed<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

function invalid(field: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error: `${field}_invalid` }, { status: 422 }) };
}

// ---- Janela ----

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const UNIX_SECONDS = /^\d+$/;

// Brazil abolished DST in 2019, so America/Sao_Paulo is a fixed -03:00 offset.
// That keeps a date-only bound convertible without a timezone database.
const BRT_OFFSET = "-03:00";

function addOneDay(dateOnly: string): string {
  const next = new Date(`${dateOnly}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/**
 * Accepts unix seconds, `YYYY-MM-DD`, or a full ISO-8601 instant. A date-only
 * bound is read as midnight in Brasília, matching how the server closes its
 * buckets. For `to` it lands on the START of the following day, so a filter of
 * "01/07 a 31/07" covers the whole 31st (the window is half-open).
 */
function parseBound(raw: string, isExclusiveEnd: boolean): string | null {
  if (raw === "") return "0"; // let the server apply its default

  if (UNIX_SECONDS.test(raw)) return raw;

  const iso = DATE_ONLY.test(raw)
    ? `${isExclusiveEnd ? addOneDay(raw) : raw}T00:00:00${BRT_OFFSET}`
    : raw;

  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;

  const seconds = Math.floor(ms / 1000);
  return seconds < 0 ? null : String(seconds);
}

const MAX_WINDOW_SECONDS = 366 * 24 * 60 * 60;

export function parseWindow(params: URLSearchParams): Parsed<RevenueWindow> {
  const from = parseBound((params.get("from") ?? "").trim(), false);
  if (from == null) return invalid("from");

  const to = parseBound((params.get("to") ?? "").trim(), true);
  if (to == null) return invalid("to");

  // The server enforces these too and stays the authority. Checking here as
  // well means a malformed window reports "período inválido" even when web-api
  // is down, instead of being indistinguishable from an upstream outage.
  if (from !== "0" && to !== "0") {
    const span = Number(to) - Number(from);
    if (span <= 0) return invalid("window");
    if (span > MAX_WINDOW_SECONDS) return invalid("window_range");
  }

  return { ok: true, value: { from_unix: from, to_unix: to } };
}

// ---- Paginação ----

export type Paging = { limit: number; offset: number };

/** Clamps rather than rejecting — an out-of-range page size is not user error. */
export function parsePaging(params: URLSearchParams, defaultLimit: number, maxLimit: number): Paging {
  const rawLimit = Number(params.get("limit"));
  const limit =
    Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;

  const rawOffset = Number(params.get("offset"));
  const offset = Number.isSafeInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0;

  return { limit, offset };
}

// ---- Filtros ----

/** "0" means every account. Kept as a string: account ids are int64. */
export function parseAccountId(params: URLSearchParams): Parsed<string> {
  const raw = (params.get("accountId") ?? "").trim();
  if (raw === "") return { ok: true, value: "0" };
  if (!UNIX_SECONDS.test(raw)) return invalid("account_id");

  return { ok: true, value: raw };
}

function parseEnum<T extends string>(
  params: URLSearchParams,
  name: string,
  field: string,
  table: Record<string, T>,
  fallback: T,
): Parsed<T> {
  const raw = (params.get(name) ?? "").trim().toLowerCase();
  if (raw === "") return { ok: true, value: fallback };

  const value = table[raw];
  return value ? { ok: true, value } : invalid(field);
}

export function parseBucket(params: URLSearchParams): Parsed<RevenueBucket> {
  return parseEnum<RevenueBucket>(
    params,
    "bucket",
    "bucket",
    {
      day: "REVENUE_BUCKET_DAY",
      week: "REVENUE_BUCKET_WEEK",
      month: "REVENUE_BUCKET_MONTH",
    },
    "REVENUE_BUCKET_UNSPECIFIED",
  );
}

export function parseStatus(params: URLSearchParams): Parsed<TopupStatus> {
  return parseEnum<TopupStatus>(
    params,
    "status",
    "status",
    { paid: "TOPUP_STATUS_PAID", pending: "TOPUP_STATUS_PENDING" },
    "TOPUP_STATUS_UNSPECIFIED",
  );
}

export function parseMethod(params: URLSearchParams): Parsed<PaymentMethod> {
  return parseEnum<PaymentMethod>(
    params,
    "method",
    "method",
    { pix: "PAYMENT_METHOD_PIX", credit_card: "PAYMENT_METHOD_CREDIT_CARD" },
    "PAYMENT_METHOD_UNSPECIFIED",
  );
}

export function parseLedgerAction(params: URLSearchParams): Parsed<DonateLedgerAction> {
  return parseEnum<DonateLedgerAction>(
    params,
    "action",
    "action",
    {
      purchase: "DONATE_LEDGER_ACTION_PURCHASE",
      credit: "DONATE_LEDGER_ACTION_CREDIT",
    },
    "DONATE_LEDGER_ACTION_UNSPECIFIED",
  );
}

/** SearchAccounts rejects a prefix shorter than 2 characters; fail fast here. */
export function parseAccountQuery(params: URLSearchParams): Parsed<string> {
  const raw = (params.get("q") ?? "").trim();
  if (raw.length < 2) return invalid("query");

  return { ok: true, value: raw };
}

// ---- Mappers snake_case -> camelCase ----
//
// Contract for everything below: int64 stays a string, and a *_unix of 0 means
// "absent" and becomes null — never the epoch.

function isoOrNull(unix: string | undefined): string | null {
  if (!unix || unix === "0") return null;

  const seconds = Number(unix);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  return new Date(seconds * 1000).toISOString();
}

function num(value: string | undefined): string {
  return value ?? "0";
}

export function httpPeriod(fromUnix: string | undefined, toUnix: string | undefined): PeriodJson {
  return { from: isoOrNull(fromUnix), to: isoOrNull(toUnix) };
}

export function httpTotals(totals: RevenueTotals | undefined): RevenueTotalsJson {
  return {
    paidOrders: num(totals?.paid_orders),
    grossCents: num(totals?.gross_cents),
    creditsSold: num(totals?.credits_sold),
    distinctBuyers: num(totals?.distinct_buyers),

    createdOrders: num(totals?.created_orders),
    pendingOrders: num(totals?.pending_orders),
    pendingCents: num(totals?.pending_cents),

    shopPurchases: num(totals?.shop_purchases),
    creditsSpent: num(totals?.credits_spent),
    manualCredits: num(totals?.manual_credits),
    creditsGranted: num(totals?.credits_granted),
  };
}

export function httpByMethod(row: RevenueByMethod): RevenueByMethodJson {
  return {
    paymentMethod: row.payment_method,
    paidOrders: num(row.paid_orders),
    grossCents: num(row.gross_cents),
  };
}

export function httpPoint(point: RevenuePoint): RevenuePointJson {
  return {
    bucketStart: isoOrNull(point.bucket_start_unix),
    paidOrders: num(point.paid_orders),
    grossCents: num(point.gross_cents),
    creditsSold: num(point.credits_sold),
    distinctBuyers: num(point.distinct_buyers),
  };
}

// `provider` is deliberately dropped: nothing ever writes it, so exposing it
// would invite UI built on a permanently empty field.
export function httpTopupOrder(order: TopupOrderRow): TopupOrderJson {
  return {
    id: order.id,
    externalReference: order.external_reference,
    accountId: order.account_id,
    accountName: order.account_name,
    accountEmail: order.account_email,
    payerName: order.payer_name,
    payerCpfMasked: order.payer_cpf_masked,
    credits: order.credits,
    amountCents: num(order.amount_cents),
    paymentMethod: order.payment_method,
    status: order.status,
    createdAt: isoOrNull(order.created_at_unix),
    confirmedAt: isoOrNull(order.confirmed_at_unix),
  };
}

export function httpTopBuyer(buyer: TopBuyerRow): TopBuyerJson {
  return {
    accountId: buyer.account_id,
    accountName: buyer.account_name,
    accountEmail: buyer.account_email,
    windowPaidOrders: num(buyer.window_paid_orders),
    windowGrossCents: num(buyer.window_gross_cents),
    lifetimePaidOrders: num(buyer.lifetime_paid_orders),
    lifetimeGrossCents: num(buyer.lifetime_gross_cents),
    lifetimeCredits: num(buyer.lifetime_credits),
    firstPaidAt: isoOrNull(buyer.first_paid_at_unix),
    lastPaidAt: isoOrNull(buyer.last_paid_at_unix),
    donateBalance: buyer.donate_balance,
  };
}

export function httpLedgerEntry(entry: DonateLedgerRow): DonateLedgerEntryJson {
  return {
    id: entry.id,
    action: entry.action,
    createdAt: isoOrNull(entry.created_at_unix),
    subject: { accountId: entry.subject_account_id, accountName: entry.subject_account_name },
    actor: { accountId: entry.actor_account_id, accountName: entry.actor_account_name },
    creditsDelta: num(entry.credits_delta),
    balanceAfter: num(entry.balance_after),
    shopItemId: num(entry.shop_item_id),
    shopItemTitle: entry.shop_item_title,
    reason: entry.reason,
  };
}

export function httpAccount(account: AccountSummary): AccountSummaryJson {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    donateBalance: account.donate_balance,
    role: account.role,
    isBlocked: account.is_blocked,
  };
}
