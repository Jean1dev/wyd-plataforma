"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { DonateLedgerJson, RevenueSummaryJson, TopBuyersJson, TopupOrdersJson } from "@/lib/revenue/http-types";
import { formatBrtDate } from "@/lib/revenue/format";
import { StateNotice } from "../../npcs/_components/StateNotice";
import { AccountFilter } from "./AccountFilter";
import { DonateLedgerTable } from "./DonateLedgerTable";
import { KpiHeader } from "./KpiHeader";
import { OrdersTable, type OrdersFilters } from "./OrdersTable";
import { PeriodFilter, defaultPeriod, type Period } from "./PeriodFilter";
import { RevenueChart, type BucketId } from "./RevenueChart";
import { TopBuyersTable } from "./TopBuyersTable";
import {
  RevenueRequestError,
  errorMessage,
  fetchDonateLedger,
  fetchOrders,
  fetchSummary,
  fetchTopBuyers,
  type LoadStatus,
} from "./api";

const PAGE_SIZE = 50;

type Tab = "orders" | "buyers" | "ledger";

const TABS: { id: Tab; label: string }[] = [
  { id: "orders", label: "Pedidos" },
  { id: "buyers", label: "Compradores" },
  { id: "ledger", label: "Extrato de donate" },
];

type Loaded<T> = { status: LoadStatus; data: T | null };

function idle<T>(): Loaded<T> {
  return { status: "idle", data: null };
}

function failureStatus(err: unknown): LoadStatus {
  return err instanceof RevenueRequestError ? err.status : "error";
}

/**
 * Runs `run` under an AbortController, keeping the previous data visible while
 * the new page loads. `after` runs on success, once the data is in. Returns the
 * cleanup for useEffect.
 */
function load<T>(
  run: (signal: AbortSignal) => Promise<T>,
  set: (next: Loaded<T>) => void,
  current: T | null,
  after?: (data: T) => void,
) {
  const controller = new AbortController();

  set({ status: "loading", data: current });

  run(controller.signal)
    .then((data) => {
      if (controller.signal.aborted) return;
      set({ status: "ok", data });
      after?.(data);
    })
    .catch((err) => {
      if (controller.signal.aborted) return;
      set({ status: failureStatus(err), data: null });
    });

  return () => controller.abort();
}

/**
 * Landing past the end of a result set that shrank (the window moved, a filter
 * narrowed it): rewind to the first page instead of showing an empty table that
 * still claims N results exist.
 */
function rewindIfPastEnd<T>(offset: number, setOffset: (next: number) => void, rowsOf: (data: T) => number) {
  return (data: T) => {
    if (offset > 0 && rowsOf(data) === 0) setOffset(0);
  };
}

export function RevenueDashboard() {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [account, setAccount] = useState({ id: "", name: "" });
  const accountId = account.id;
  const [bucket, setBucket] = useState<BucketId>("day");
  const [tab, setTab] = useState<Tab>("orders");
  const [reloadKey, setReloadKey] = useState(0);

  const [summary, setSummary] = useState<Loaded<RevenueSummaryJson>>(idle);
  const [orders, setOrders] = useState<Loaded<TopupOrdersJson>>(idle);
  const [buyers, setBuyers] = useState<Loaded<TopBuyersJson>>(idle);
  const [ledger, setLedger] = useState<Loaded<DonateLedgerJson>>(idle);

  const [orderFilters, setOrderFilters] = useState<OrdersFilters>({ status: "", method: "" });
  const [ledgerAction, setLedgerAction] = useState("");

  const [ordersOffset, setOrdersOffset] = useState(0);
  const [buyersOffset, setBuyersOffset] = useState(0);
  const [ledgerOffset, setLedgerOffset] = useState(0);

  const window = { from: period.from, to: period.to };

  // Any change to the shared filters invalidates every page cursor — staying on
  // page 4 of a different result set is never what the operator meant.
  const resetPages = useCallback(() => {
    setOrdersOffset(0);
    setBuyersOffset(0);
    setLedgerOffset(0);
  }, []);

  const changePeriod = useCallback(
    (next: Period) => {
      setPeriod(next);
      resetPages();
    },
    [resetPages],
  );

  const changeAccount = useCallback(
    (id: string, name: string) => {
      setAccount({ id, name });
      resetPages();
    },
    [resetPages],
  );

  useEffect(
    () =>
      load(
        (signal) => fetchSummary({ ...window, bucket, accountId: accountId || undefined }, signal),
        setSummary,
        null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period.from, period.to, accountId, bucket, reloadKey],
  );

  useEffect(() => {
    if (tab !== "orders") return;
    return load(
      (signal) =>
        fetchOrders(
          {
            ...window,
            accountId: accountId || undefined,
            status: orderFilters.status || undefined,
            method: orderFilters.method || undefined,
            limit: PAGE_SIZE,
            offset: ordersOffset,
          },
          signal,
        ),
      setOrders,
      orders.data,
      rewindIfPastEnd(ordersOffset, setOrdersOffset, (d) => d.orders.length),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period.from, period.to, accountId, orderFilters.status, orderFilters.method, ordersOffset, reloadKey]);

  useEffect(() => {
    if (tab !== "buyers") return;
    return load(
      (signal) => fetchTopBuyers({ ...window, limit: PAGE_SIZE, offset: buyersOffset }, signal),
      setBuyers,
      buyers.data,
      rewindIfPastEnd(buyersOffset, setBuyersOffset, (d) => d.buyers.length),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period.from, period.to, buyersOffset, reloadKey]);

  useEffect(() => {
    if (tab !== "ledger") return;
    return load(
      (signal) =>
        fetchDonateLedger(
          {
            ...window,
            accountId: accountId || undefined,
            action: ledgerAction || undefined,
            limit: PAGE_SIZE,
            offset: ledgerOffset,
          },
          signal,
        ),
      setLedger,
      ledger.data,
      rewindIfPastEnd(ledgerOffset, setLedgerOffset, (d) => d.entries.length),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period.from, period.to, accountId, ledgerAction, ledgerOffset, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const drillDown = useCallback(
    (id: string, name: string) => {
      setAccount({ id, name });
      setTab("orders");
      resetPages();
    },
    [resetPages],
  );

  // The period the SERVER applied, which is what the numbers actually describe.
  const applied = summary.data?.period;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          background: "var(--grad-panel)",
          border: "1px solid var(--iron-400)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--bevel-raise), var(--shadow-md)",
          padding: "20px 22px",
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <PeriodFilter period={period} onChange={changePeriod} />

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <AccountFilter accountId={account.id} accountName={account.name} onChange={changeAccount} />
          <button
            type="button"
            className="wyd-btn wyd-btn--ghost wyd-btn--sm"
            onClick={refresh}
            disabled={summary.status === "loading"}
            style={{ marginTop: 22 }}
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </div>
      </section>

      {applied?.from && applied.to ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", margin: 0 }}>
          Exibindo {formatBrtDate(applied.from)} até {formatBrtDate(applied.to)} (horário de Brasília).
        </p>
      ) : null}

      {summary.status !== "ok" && !summary.data ? (
        summary.status === "loading" || summary.status === "idle" ? (
          <StateNotice title="Carregando faturamento…" />
        ) : (
          <StateNotice title="Não foi possível carregar o resumo">
            {errorMessage(summary.status)}
            {summary.status !== "forbidden" ? (
              <div style={{ marginTop: 12 }}>
                <button type="button" className="wyd-btn wyd-btn--ghost wyd-btn--sm" onClick={refresh}>
                  Tentar novamente
                </button>
              </div>
            ) : null}
          </StateNotice>
        )
      ) : summary.data ? (
        <div style={{ display: "grid", gap: 16, opacity: summary.status === "loading" ? 0.6 : 1 }}>
          <KpiHeader totals={summary.data.totals} byMethod={summary.data.byMethod} />
          <RevenueChart
            series={summary.data.series}
            bucket={bucket}
            onBucketChange={setBucket}
            loading={summary.status === "loading"}
          />
        </div>
      ) : null}

      <div>
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid var(--iron-400)",
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--gold-400)" : "transparent"}`,
                  padding: "10px 16px",
                  color: active ? "var(--gold-300)" : "var(--text-muted)",
                  fontFamily: "var(--font-ui)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "orders" ? (
          <OrdersTable
            orders={orders.data?.orders ?? []}
            totalCount={orders.data?.totalCount ?? 0}
            status={orders.status}
            filters={orderFilters}
            offset={ordersOffset}
            pageSize={PAGE_SIZE}
            onFiltersChange={(next) => {
              setOrderFilters(next);
              setOrdersOffset(0);
            }}
            onOffsetChange={setOrdersOffset}
            onRetry={refresh}
            onSelectAccount={drillDown}
          />
        ) : null}

        {tab === "buyers" ? (
          <TopBuyersTable
            buyers={buyers.data?.buyers ?? []}
            totalCount={buyers.data?.totalCount ?? 0}
            status={buyers.status}
            offset={buyersOffset}
            pageSize={PAGE_SIZE}
            onOffsetChange={setBuyersOffset}
            onRetry={refresh}
            onDrillDown={drillDown}
          />
        ) : null}

        {tab === "ledger" ? (
          <DonateLedgerTable
            entries={ledger.data?.entries ?? []}
            totalCount={ledger.data?.totalCount ?? 0}
            status={ledger.status}
            action={ledgerAction}
            offset={ledgerOffset}
            pageSize={PAGE_SIZE}
            onActionChange={(next) => {
              setLedgerAction(next);
              setLedgerOffset(0);
            }}
            onOffsetChange={setLedgerOffset}
            onRetry={refresh}
            onSelectAccount={changeAccount}
          />
        ) : null}
      </div>
    </div>
  );
}
