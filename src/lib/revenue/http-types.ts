// The camelCase JSON shapes the /api/admin/revenue/* routes return to the
// browser. Imported by both the Route Handlers (to type the snake_case →
// camelCase mappers in _shared.ts) and the client components, so the two sides
// cannot drift.
//
// Two rules the types encode:
//   - every proto int64 stays a string here; above 2^53 JavaScript loses
//     precision silently;
//   - every proto *_unix becomes an ISO-8601 string, or null when it was 0
//     (absent), never 1970-01-01.

export type PeriodJson = {
  // The window the SERVER actually applied, after its own defaults.
  from: string | null;
  to: string | null;
};

export type RevenueTotalsJson = {
  // Real money, recognized on confirmed_at.
  paidOrders: string;
  grossCents: string;
  creditsSold: string;
  distinctBuyers: string;

  // Orders CREATED in the window (the conversion denominator).
  createdOrders: string;
  pendingOrders: string;
  // NOT revenue and NOT "a receber" — nothing ever expires a PENDING order.
  pendingCents: string;

  // Donate wallet flow, in CREDITS. Never add these to any *Cents field.
  shopPurchases: string;
  creditsSpent: string;
  manualCredits: string;
  creditsGranted: string;
};

export type RevenueByMethodJson = {
  paymentMethod: string;
  paidOrders: string;
  grossCents: string;
};

export type RevenuePointJson = {
  bucketStart: string | null;
  paidOrders: string;
  grossCents: string;
  creditsSold: string;
  distinctBuyers: string;
};

export type RevenueSummaryJson = {
  period: PeriodJson;
  totals: RevenueTotalsJson;
  byMethod: RevenueByMethodJson[];
  series: RevenuePointJson[];
};

export type TopupOrderJson = {
  id: string;
  externalReference: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  payerName: string;
  payerCpfMasked: string;
  credits: number;
  amountCents: string;
  paymentMethod: string;
  status: string;
  createdAt: string | null;
  confirmedAt: string | null;
};

export type TopupOrdersJson = {
  period: PeriodJson;
  totalCount: number;
  orders: TopupOrderJson[];
};

export type TopBuyerJson = {
  accountId: string;
  accountName: string;
  accountEmail: string;
  windowPaidOrders: string;
  windowGrossCents: string;
  lifetimePaidOrders: string;
  lifetimeGrossCents: string;
  lifetimeCredits: string;
  firstPaidAt: string | null;
  lastPaidAt: string | null;
  // Current wallet of THIS account, for drill-down context. Never sum this
  // column — it only covers the accounts on the current page.
  donateBalance: number;
};

export type TopBuyersJson = {
  period: PeriodJson;
  totalCount: number;
  buyers: TopBuyerJson[];
};

export type LedgerPartyJson = {
  accountId: string;
  accountName: string;
};

export type DonateLedgerEntryJson = {
  id: string;
  action: string;
  createdAt: string | null;
  // subject = whose wallet moved. actor = who caused it (the moderator, on a
  // manual credit).
  subject: LedgerPartyJson;
  actor: LedgerPartyJson;
  creditsDelta: string;
  balanceAfter: string;
  shopItemId: string;
  // Empty when the offer was deleted after the purchase — fall back to
  // shopItemId rather than rendering a blank cell.
  shopItemTitle: string;
  reason: string;
};

export type DonateLedgerJson = {
  period: PeriodJson;
  totalCount: number;
  entries: DonateLedgerEntryJson[];
};

export type AccountSummaryJson = {
  id: string;
  name: string;
  email: string;
  donateBalance: number;
  role: string;
  isBlocked: boolean;
};

export type AccountsJson = {
  accounts: AccountSummaryJson[];
};
