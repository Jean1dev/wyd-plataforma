"use client";

import type { TopBuyerJson } from "@/lib/revenue/http-types";
import { formatBrtDate, formatCents, formatCount, formatCredits } from "@/lib/revenue/format";
import type { LoadStatus } from "./api";
import { Pagination, TablePanel, TableState, cell, hasRows, monoCell, numericCell, numericTh, th } from "./table";

export function TopBuyersTable({
  buyers,
  totalCount,
  status,
  offset,
  pageSize,
  onOffsetChange,
  onRetry,
  onDrillDown,
}: {
  buyers: TopBuyerJson[];
  totalCount: number;
  status: LoadStatus;
  offset: number;
  pageSize: number;
  onOffsetChange: (next: number) => void;
  onRetry: () => void;
  onDrillDown: (accountId: string, accountName: string) => void;
}) {
  const ready = hasRows(status, buyers.length);

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", margin: "0 0 14px" }}>
        Ordenado pela receita do período. As colunas de vida inteira são acumuladas desde sempre, não do período —
        clique numa conta para abrir os pedidos dela.
      </p>

      {!ready ? (
        <TableState
          status={status}
          empty={buyers.length === 0}
          emptyLabel="Nenhuma conta pagou no período."
          onRetry={onRetry}
        />
      ) : (
        <>
          <TablePanel minWidth={940}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Conta</th>
                <th style={numericTh}>Receita no período</th>
                <th style={numericTh}>Pedidos</th>
                <th style={numericTh}>Receita total</th>
                <th style={numericTh}>Créditos totais</th>
                <th style={numericTh}>Saldo atual</th>
                <th style={th}>Primeira compra</th>
                <th style={th}>Última compra</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((buyer, index) => (
                <tr key={buyer.accountId}>
                  <td style={{ ...monoCell, color: "var(--text-muted)" }}>{offset + index + 1}</td>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => onDrillDown(buyer.accountId, buyer.accountName)}
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
                      {buyer.accountName || `#${buyer.accountId}`}
                    </button>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{buyer.accountEmail}</div>
                  </td>
                  <td style={{ ...numericCell, color: "var(--parchment-100)", fontWeight: 600 }}>
                    {formatCents(buyer.windowGrossCents)}
                  </td>
                  <td style={numericCell}>{formatCount(buyer.windowPaidOrders)}</td>
                  <td style={numericCell}>
                    {formatCents(buyer.lifetimeGrossCents)}
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {formatCount(buyer.lifetimePaidOrders)} pedidos
                    </div>
                  </td>
                  <td style={{ ...numericCell, color: "var(--amethyst-400)" }}>
                    {formatCredits(buyer.lifetimeCredits)}
                  </td>
                  <td style={numericCell} title="Saldo desta conta agora — não é um valor do período">
                    {formatCredits(buyer.donateBalance)}
                  </td>
                  <td style={monoCell}>{formatBrtDate(buyer.firstPaidAt)}</td>
                  <td style={monoCell}>{formatBrtDate(buyer.lastPaidAt)}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>

          <Pagination
            offset={offset}
            pageSize={pageSize}
            rowCount={buyers.length}
            totalCount={totalCount}
            loading={status === "loading"}
            onOffsetChange={onOffsetChange}
          />
        </>
      )}
    </div>
  );
}
