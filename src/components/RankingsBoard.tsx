"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { RankRow } from "@/components/ui";
import { wydClassFromCode } from "@/lib/wyd-class";

const PAGE_SIZE = 50;

type RankingEntry = {
  rank: number;
  name: string;
  class: number;
  clan: number;
  guildId: number;
  level: number;
  exp: string;
  classMaster: number;
};

type RankingResponse = {
  entries: RankingEntry[];
  totalCount: number;
};

function formatExp(exp: string) {
  return exp.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function RankingsBoard() {
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(false);

      try {
        const res = await fetch(`/api/ranking?limit=${PAGE_SIZE}&offset=${offset}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("ranking_fetch_failed");
        const nextData = (await res.json()) as RankingResponse;
        setData(nextData);
      } catch {
        if (controller.signal.aborted) return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [offset, refreshKey]);

  const rows = data?.entries ?? [];
  const totalCount = data?.totalCount ?? 0;
  const hasPrevious = offset > 0;
  const hasNext = offset + rows.length < totalCount;
  const range = useMemo(() => {
    if (totalCount === 0 || rows.length === 0) return "0 de 0";
    return `${offset + 1}-${offset + rows.length} de ${totalCount}`;
  }, [offset, rows.length, totalCount]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginRight: "auto",
          }}
        >
          Top EXP · {range}
        </div>
        <button
          className="wyd-btn wyd-btn--ghost wyd-btn--sm"
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          title="Tentar novamente"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      <div
        style={{
          background: "var(--grad-panel)",
          border: "1px solid var(--iron-400)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--bevel-raise), var(--shadow-md)",
          padding: 10,
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "6px 14px 10px",
            minWidth: 720,
            borderBottom: "1px solid var(--iron-400)",
            marginBottom: 4,
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          <span style={{ width: 32, textAlign: "center" }}>#</span>
          <span style={{ width: 38, textAlign: "center" }}>Cl</span>
          <span style={{ flex: 1 }}>Guerreiro</span>
          <span style={{ width: 58 }}>Nível</span>
          <span style={{ width: 74, textAlign: "right" }}>EXP</span>
          <span style={{ width: 130, textAlign: "right" }}>Detalhes</span>
        </div>

        <div style={{ minWidth: 720 }}>
        {loading ? (
          <div
            style={{
              padding: "28px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            Carregando ranking...
          </div>
        ) : error ? (
          <div
            style={{
              padding: "28px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            Não foi possível carregar o ranking. Tente novamente em instantes.
          </div>
        ) : rows.length === 0 ? (
          <div
            style={{
              padding: "28px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            Nenhum guerreiro desta classe no ranking ainda.
          </div>
        ) : (
          rows.map((r) => (
            <RankRow
              key={r.name}
              rank={r.rank}
              name={r.name}
              cls={wydClassFromCode(r.class)}
              classCode={r.class}
              clan={r.clan}
              classMaster={r.classMaster}
              level={r.level}
              score={formatExp(r.exp)}
              guildId={r.guildId}
            />
          ))
        )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <button
          className="wyd-btn wyd-btn--ghost wyd-btn--sm"
          type="button"
          onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
          disabled={!hasPrevious || loading}
        >
          <ChevronLeft size={14} />
          Anterior
        </button>
        <button
          className="wyd-btn wyd-btn--steel wyd-btn--sm"
          type="button"
          onClick={() => setOffset((value) => value + PAGE_SIZE)}
          disabled={!hasNext || loading || error}
        >
          Próxima
          <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
}

export default RankingsBoard;
