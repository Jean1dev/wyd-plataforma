// Formatting for the faturamento panel.
//
// Every money/credit aggregate arrives as an int64-as-string, so the helpers
// here work on the STRING, the same way src/lib/donate/format.ts does. Nothing
// divides cents by 100 as a number — the split happens on the digits, at
// formatting time only.
//
// Note: formatBRL in src/lib/donate/packages.ts does `amountCents / 100` on a
// number. That is fine for the three fixed top-up packages; it is wrong for
// int64 aggregates. Do not reuse it here.

import { formatDonate } from "@/lib/donate/format";

const INTEGER = /^-?\d+$/;

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "4560000" -> "R$ 45.600,00". Passes non-integer input through untouched. */
export function formatCents(cents: string): string {
  if (!INTEGER.test(cents)) return cents;

  const negative = cents.startsWith("-");
  const digits = (negative ? cents.slice(1) : cents).padStart(3, "0");
  const reais = digits.slice(0, -2);
  const centavos = digits.slice(-2);

  return `${negative ? "-" : ""}R$ ${groupThousands(reais)},${centavos}`;
}

/** Donate credits (game currency) — never money. "256000" -> "256.000". */
export function formatCredits(value: string | number): string {
  return formatDonate(value);
}

/** Signed credits for the ledger: "+100" / "-500". */
export function formatCreditsDelta(value: string): string {
  if (!INTEGER.test(value)) return value;
  return value.startsWith("-") ? formatCredits(value) : `+${formatCredits(value)}`;
}

/**
 * gross_cents / paid_orders in integer cents, via BigInt so a large gross does
 * not lose precision. Returns null when there were no paid orders (an average
 * of zero orders is undefined, not R$ 0,00).
 */
export function averageTicketCents(grossCents: string, paidOrders: string): string | null {
  if (!INTEGER.test(grossCents) || !INTEGER.test(paidOrders)) return null;

  // BigInt(0) rather than the 0n literal: the project targets ES2017.
  const orders = BigInt(paidOrders);
  if (orders === BigInt(0)) return null;

  return (BigInt(grossCents) / orders).toString();
}

/** Plain integer count, thousands-grouped. */
export function formatCount(value: string | number): string {
  return formatDonate(value);
}

// ---- Datas ----
//
// The server closes day/week/month buckets in America/Sao_Paulo so the panel
// agrees with a Brazilian bank statement. Every label the panel renders must be
// in that zone too, or a payment at 22h BRT lands on the wrong day.

const BRT = "America/Sao_Paulo";
const EMPTY = "—";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRT,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRT,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dayFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: BRT, day: "2-digit", month: "2-digit" });

const monthFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: BRT, month: "short", year: "2-digit" });

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatBrtDateTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? dateTimeFmt.format(d) : EMPTY;
}

export function formatBrtDate(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? dateFmt.format(d) : EMPTY;
}

/** Short axis label for one series bucket. */
export function formatBucketLabel(iso: string | null | undefined, bucket: "day" | "week" | "month"): string {
  const d = parse(iso);
  if (!d) return EMPTY;
  return bucket === "month" ? monthFmt.format(d) : dayFmt.format(d);
}

/** `YYYY-MM-DD` in BRT — the value an <input type="date"> expects. */
export function brtDateInputValue(date: Date): string {
  // en-CA gives ISO-ordered parts, so this is a zone-correct YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Cents -> reais as a plain number, for chart geometry ONLY. Recharts needs a
 * number to compute bar heights; never display or accumulate this value —
 * formatCents on the original string is the source of truth for what the user
 * reads.
 */
export function centsToReais(cents: string): number {
  const n = Number(cents);
  return Number.isFinite(n) ? n / 100 : 0;
}

const METHOD_LABELS: Record<string, string> = {
  PAYMENT_METHOD_PIX: "PIX",
  PAYMENT_METHOD_CREDIT_CARD: "Cartão de crédito",
  PAYMENT_METHOD_UNSPECIFIED: "Não informado",
};

export function paymentMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method;
}

const STATUS_LABELS: Record<string, string> = {
  TOPUP_STATUS_PAID: "Pago",
  TOPUP_STATUS_PENDING: "Aguardando",
  TOPUP_STATUS_UNSPECIFIED: "—",
};

export function topupStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
