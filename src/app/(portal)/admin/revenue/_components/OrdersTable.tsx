"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui";
import type { TopupOrderJson } from "@/lib/revenue/http-types";
import {
  formatBrtDateTime,
  formatCents,
  formatCredits,
  paymentMethodLabel,
  topupStatusLabel,
} from "@/lib/revenue/format";
import type { LoadStatus } from "./api";
import { Pagination, TablePanel, TableState, cell, hasRows, monoCell, numericCell, numericTh, th } from "./table";

export type OrdersFilters = { status: string; method: string };

const select: React.CSSProperties = {
  padding: "8px 10px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
};

const legend: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

// external_reference is the key used to reconcile against the gateway (and the
// only handle on a chargeback), so it has to be copyable, not just readable.
function ExternalReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked (insecure context / denied permission) — the full
      // value is in the title attribute, so it stays selectable by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={value}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        color: copied ? "var(--emerald-400)" : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {value.slice(0, 8)}…
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "TOPUP_STATUS_PAID") return <Badge variant="gold">{topupStatusLabel(status)}</Badge>;
  return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{topupStatusLabel(status)}</span>;
}

export function OrdersTable({
  orders,
  totalCount,
  status,
  filters,
  offset,
  pageSize,
  onFiltersChange,
  onOffsetChange,
  onRetry,
  onSelectAccount,
}: {
  orders: TopupOrderJson[];
  totalCount: number;
  status: LoadStatus;
  filters: OrdersFilters;
  offset: number;
  pageSize: number;
  onFiltersChange: (next: OrdersFilters) => void;
  onOffsetChange: (next: number) => void;
  onRetry: () => void;
  onSelectAccount: (accountId: string, accountName: string) => void;
}) {
  const ready = hasRows(status, orders.length);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={legend}>Status</span>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            style={select}
          >
            <option value="">Todos</option>
            <option value="paid">Pagos</option>
            <option value="pending">Aguardando</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={legend}>Método</span>
          <select
            value={filters.method}
            onChange={(e) => onFiltersChange({ ...filters, method: e.target.value })}
            style={select}
          >
            <option value="">Todos</option>
            <option value="pix">PIX</option>
            <option value="credit_card">Cartão de crédito</option>
          </select>
        </label>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", paddingBottom: 9 }}>
          Pedidos pagos são filtrados pela data de confirmação; os demais, pela data de criação.
        </span>
      </div>

      {!ready ? (
        <TableState status={status} empty={orders.length === 0} emptyLabel="Nenhum pedido no período." onRetry={onRetry} />
      ) : (
        <>
          <TablePanel minWidth={980}>
            <thead>
              <tr>
                <th style={th}>Criado</th>
                <th style={th}>Conta</th>
                <th style={th}>Pagador</th>
                <th style={th}>Referência</th>
                <th style={numericTh}>Créditos</th>
                <th style={numericTh}>Valor</th>
                <th style={th}>Método</th>
                <th style={th}>Status</th>
                <th style={th}>Confirmado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={monoCell}>{formatBrtDateTime(order.createdAt)}</td>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => onSelectAccount(order.accountId, order.accountName)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        color: "var(--gold-300)",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {order.accountName || `#${order.accountId}`}
                    </button>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{order.accountEmail}</div>
                  </td>
                  <td style={cell}>
                    {order.payerName || <span style={{ color: "var(--text-faint)" }}>—</span>}
                    {order.payerCpfMasked ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                        {order.payerCpfMasked}
                      </div>
                    ) : null}
                  </td>
                  <td style={cell}>
                    <ExternalReference value={order.externalReference} />
                  </td>
                  <td style={numericCell}>{formatCredits(order.credits)}</td>
                  <td style={{ ...numericCell, color: "var(--parchment-100)", fontWeight: 600 }}>
                    {formatCents(order.amountCents)}
                  </td>
                  <td style={cell}>{paymentMethodLabel(order.paymentMethod)}</td>
                  <td style={cell}>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={monoCell}>{formatBrtDateTime(order.confirmedAt)}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>

          <Pagination
            offset={offset}
            pageSize={pageSize}
            rowCount={orders.length}
            totalCount={totalCount}
            loading={status === "loading"}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </div>
  );
}
