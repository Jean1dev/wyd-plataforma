"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Combobox, type ComboOption } from "../../npcs/_components/Combobox";
import { formatCredits } from "@/lib/revenue/format";
import { searchAccounts } from "./api";

// SearchAccounts rejects a prefix shorter than 2 characters, so we don't even
// call below that. Unlike the NPC/item pickers there is no preloadable catalog
// here — accounts are searched remotely — hence Combobox's onQueryChange.

const MIN_PREFIX = 2;
const DEBOUNCE_MS = 250;

export function AccountFilter({
  accountId,
  accountName,
  onChange,
}: {
  accountId: string;
  accountName: string;
  onChange: (accountId: string, accountName: string) => void;
}) {
  const [found, setFound] = useState<ComboOption[]>([]);
  const [query, setQuery] = useState("");
  const [searchNote, setSearchNote] = useState<string | null>(null);

  const term = query.trim();
  const searchable = term.length >= MIN_PREFIX;

  useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await searchAccounts(term, controller.signal);
        setFound(
          data.accounts.map<ComboOption>((a) => ({
            value: a.id,
            label: a.name,
            hint: `${formatCredits(a.donateBalance)} donate`,
          })),
        );
        setSearchNote(data.accounts.length === 0 ? "Nenhuma conta encontrada." : null);
      } catch {
        if (controller.signal.aborted) return;
        setFound([]);
        setSearchNote("Não foi possível buscar contas agora.");
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term, searchable]);

  // Derived, not stored: a too-short term simply has no results to show, and
  // stale ones from a previous term must not linger.
  const results = useMemo(() => (searchable ? found : []), [searchable, found]);
  const note = term.length === 0 ? null : searchable ? searchNote : `Digite ao menos ${MIN_PREFIX} caracteres.`;

  // Keep the selected account resolvable even when it was picked by drill-down
  // from a table and so never appeared in a search result — otherwise the
  // closed combobox shows a bare account id.
  const options = useMemo(() => {
    if (!accountId || results.some((o) => o.value === accountId)) return results;
    return [{ value: accountId, label: accountName || `#${accountId}` }, ...results];
  }, [results, accountId, accountName]);

  const commit = useCallback(
    (value: string) => {
      onChange(value, options.find((o) => o.value === value)?.label ?? "");
    },
    [onChange, options],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        Conta
      </span>

      <Combobox
        compact
        available
        value={accountId}
        options={options}
        onQueryChange={setQuery}
        onChange={commit}
        placeholder="Buscar por login…"
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, minHeight: 16 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-faint)" }}>
          {note ?? "Deixe vazio para ver todas as contas."}
        </span>
        {accountId ? (
          <button
            type="button"
            onClick={() => onChange("", "")}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: "var(--gold-300)",
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}
