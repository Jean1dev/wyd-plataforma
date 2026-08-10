"use client";

import type { ReactNode } from "react";
import { Stat } from "@/components/ui";
import type { RevenueByMethodJson, RevenueTotalsJson } from "@/lib/revenue/http-types";
import {
  averageTicketCents,
  formatCents,
  formatCount,
  formatCredits,
  paymentMethodLabel,
} from "@/lib/revenue/format";

// Three blocks, deliberately not one row of tiles:
//   1. money recognized on confirmed_at — the actual revenue;
//   2. donate credits — a different unit, never summable with the above;
//   3. PENDING — neither of the two, and not "a receber" either.

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "var(--grad-panel)",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--bevel-raise), var(--shadow-md)",
        padding: "20px 22px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          color: "var(--parchment-100)",
          margin: "0 0 2px",
        }}
      >
        {title}
      </h2>
      {description ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-faint)", margin: "0 0 16px" }}>
          {description}
        </p>
      ) : (
        <div style={{ height: 14 }} />
      )}
      {children}
    </section>
  );
}

const tiles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 18,
};

// Grid items default to min-width:auto, so a long value (a credits total can
// run to a dozen digits) pushes past the panel and gets clipped instead of
// wrapping. minWidth:0 lets the cell shrink; overflowWrap breaks the digits
// rather than hiding them.
function Tile({ children }: { children: ReactNode }) {
  return <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</div>;
}

export function KpiHeader({ totals, byMethod }: { totals: RevenueTotalsJson; byMethod: RevenueByMethodJson[] }) {
  const ticket = averageTicketCents(totals.grossCents, totals.paidOrders);

  const conversion =
    Number(totals.createdOrders) > 0
      ? `${Math.round((Number(totals.paidOrders) / Number(totals.createdOrders)) * 100)}% dos ${formatCount(
          totals.createdOrders,
        )} criados`
      : undefined;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel
        title="Receita reconhecida"
        description="Pedidos confirmados pelo gateway no período. Um pedido criado em um mês e pago no seguinte conta no mês do pagamento."
      >
        <div style={tiles}>
          <Tile>
            <Stat label="Receita bruta" value={formatCents(totals.grossCents)} />
          </Tile>
          <Tile>
            <Stat label="Pedidos pagos" value={formatCount(totals.paidOrders)} sub={conversion} />
          </Tile>
          <Tile>
            <Stat
              label="Ticket médio"
              value={ticket ? formatCents(ticket) : "—"}
              accent="var(--parchment-100)"
              sub={ticket ? undefined : "sem pedidos pagos"}
            />
          </Tile>
          <Tile>
            <Stat
              label="Compradores"
              value={formatCount(totals.distinctBuyers)}
              accent="var(--parchment-100)"
              sub="contas distintas"
            />
          </Tile>
        </div>

        {byMethod.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--iron-500, #2a2620)",
            }}
          >
            {byMethod.map((m) => (
              <span
                key={m.paymentMethod}
                style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-muted)" }}
              >
                {paymentMethodLabel(m.paymentMethod)}:{" "}
                <strong style={{ color: "var(--parchment-100)" }}>{formatCents(m.grossCents)}</strong>{" "}
                ({formatCount(m.paidOrders)})
              </span>
            ))}
          </div>
        ) : null}
      </Panel>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Panel
          title="Créditos donate"
          description="Moeda do jogo, não dinheiro. Nunca some estes números com a receita — a taxa de conversão varia por pedido."
        >
          <div style={tiles}>
            <Tile>
              <Stat
                label="Créditos vendidos"
                value={formatCredits(totals.creditsSold)}
                accent="var(--amethyst-400)"
              />
            </Tile>
            <Tile>
              <Stat
                label="Gastos na loja"
                value={formatCredits(totals.creditsSpent)}
                accent="var(--amethyst-400)"
                sub={`${formatCount(totals.shopPurchases)} compras`}
              />
            </Tile>
            <Tile>
              <Stat
                label="Cortesia"
                value={formatCredits(totals.creditsGranted)}
                accent="var(--steel-300)"
                sub={`${formatCount(totals.manualCredits)} créditos manuais`}
              />
            </Tile>
          </div>
        </Panel>

        <Panel
          title="Aguardando pagamento (histórico)"
          description="Pedidos criados no período e ainda PENDING. Nada expira um pedido abandonado, então este valor só cresce: não é receita nem contas a receber."
        >
          <div style={tiles}>
            <Tile>
              <Stat
                label="Pedidos pendentes"
                value={formatCount(totals.pendingOrders)}
                accent="var(--text-muted)"
              />
            </Tile>
            <Tile>
              <Stat label="Valor pendente" value={formatCents(totals.pendingCents)} accent="var(--text-muted)" />
            </Tile>
          </div>
        </Panel>
      </div>
    </div>
  );
}
