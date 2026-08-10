"use client";

import type { DonateLedgerEntryJson } from "@/lib/revenue/http-types";
import { formatBrtDateTime, formatCredits, formatCreditsDelta } from "@/lib/revenue/format";
import type { LoadStatus } from "./api";
import { Pagination, TablePanel, TableState, cell, hasRows, monoCell, numericCell, numericTh, th } from "./table";

const legend: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const select: React.CSSProperties = {
  padding: "8px 10px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
};

function actionLabel(action: string): string {
  if (action === "DONATE_LEDGER_ACTION_PURCHASE") return "Compra";
  if (action === "DONATE_LEDGER_ACTION_CREDIT") return "Crédito manual";
  return "—";
}

/** shop_item_id is deliberately not an FK, so a deleted offer leaves an empty
 *  title. Showing the raw id keeps old purchases from looking corrupted. */
function itemLabel(entry: DonateLedgerEntryJson): string {
  if (entry.shopItemTitle) return entry.shopItemTitle;
  if (entry.shopItemId && entry.shopItemId !== "0") return `Oferta removida (#${entry.shopItemId})`;
  return "—";
}

export function DonateLedgerTable({
  entries,
  totalCount,
  status,
  action,
  offset,
  pageSize,
  onActionChange,
  onOffsetChange,
  onRetry,
  onSelectAccount,
}: {
  entries: DonateLedgerEntryJson[];
  totalCount: number;
  status: LoadStatus;
  action: string;
  offset: number;
  pageSize: number;
  onActionChange: (next: string) => void;
  onOffsetChange: (next: number) => void;
  onRetry: () => void;
  onSelectAccount: (accountId: string, accountName: string) => void;
}) {
  const ready = hasRows(status, entries.length);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={legend}>Movimento</span>
          <select value={action} onChange={(e) => onActionChange(e.target.value)} style={select}>
            <option value="">Todos</option>
            <option value="purchase">Compras</option>
            <option value="credit">Créditos manuais</option>
          </select>
        </label>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", paddingBottom: 9 }}>
          Valores em créditos donate, não em reais. <strong>Conta</strong> é de quem a carteira se moveu;{" "}
          <strong>responsável</strong> é quem causou — o moderador, num crédito manual.
        </span>
      </div>

      {!ready ? (
        <TableState
          status={status}
          empty={entries.length === 0}
          emptyLabel="Nenhum movimento de créditos no período."
          onRetry={onRetry}
        />
      ) : (
        <>
          <TablePanel minWidth={940}>
            <thead>
              <tr>
                <th style={th}>Data</th>
                <th style={th}>Movimento</th>
                <th style={th}>Conta</th>
                <th style={th}>Responsável</th>
                <th style={th}>Oferta / motivo</th>
                <th style={numericTh}>Créditos</th>
                <th style={numericTh}>Saldo após</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const negative = entry.creditsDelta.startsWith("-");
                const sameParty = entry.subject.accountId === entry.actor.accountId;

                return (
                  <tr key={entry.id}>
                    <td style={monoCell}>{formatBrtDateTime(entry.createdAt)}</td>
                    <td style={cell}>{actionLabel(entry.action)}</td>
                    <td style={cell}>
                      <button
                        type="button"
                        onClick={() => onSelectAccount(entry.subject.accountId, entry.subject.accountName)}
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
                        {entry.subject.accountName || `#${entry.subject.accountId}`}
                      </button>
                    </td>
                    <td style={{ ...cell, color: sameParty ? "var(--text-faint)" : "var(--steel-300)" }}>
                      {sameParty ? "o próprio" : entry.actor.accountName || `#${entry.actor.accountId}`}
                    </td>
                    <td style={cell}>
                      {itemLabel(entry)}
                      {entry.reason ? (
                        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{entry.reason}</div>
                      ) : null}
                    </td>
                    <td
                      style={{
                        ...numericCell,
                        fontWeight: 600,
                        color: negative ? "var(--blood-400)" : "var(--emerald-400)",
                      }}
                    >
                      {formatCreditsDelta(entry.creditsDelta)}
                    </td>
                    <td style={numericCell}>{formatCredits(entry.balanceAfter)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TablePanel>

          <Pagination
            offset={offset}
            pageSize={pageSize}
            rowCount={entries.length}
            totalCount={totalCount}
            loading={status === "loading"}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </div>
  );
}
