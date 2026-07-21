"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type FormEvent,
} from "react";
import { ChevronDown, ChevronRight, Package, RefreshCw, Search, Users } from "lucide-react";
import { Button, Checkbox, Input } from "@/components/ui";

type DropItemMob = {
  templateName: string;
  mobName: string;
  mobLevel: number;
  slot: number;
  rateDivisor: number;
};

type DropItemEntry = {
  itemIndex: number;
  itemName: string;
  mobs: DropItemMob[];
};

type MobDropItem = {
  slot: number;
  itemIndex: number;
  itemName: string;
  rateDivisor: number;
};

type MobDropEntry = {
  templateName: string;
  mobName: string;
  mobLevel: number;
  items: MobDropItem[];
};

type LoadStatus = "idle" | "loading" | "ok" | "forbidden" | "invalid" | "upstream" | "error";
type LoadState<T> = { status: LoadStatus; data: T[] };
type Tab = "items" | "mobs";

const panel: CSSProperties = {
  background: "var(--grad-panel)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--bevel-raise), var(--shadow-md)",
  overflow: "hidden",
};

const toolbar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: "16px 18px",
  borderBottom: "1px solid var(--iron-400)",
  flexWrap: "wrap",
};

const formGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 14,
  alignItems: "end",
  marginBottom: 16,
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--iron-400)",
  whiteSpace: "nowrap",
};

const cell: CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--iron-500, #2a2620)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-body)",
  verticalAlign: "middle",
};

const iconButton: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--iron-400)",
  background: "var(--surface-inset)",
  color: "var(--gold-300)",
  cursor: "pointer",
};

function hasItemIndexFilter(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && !/^0+$/.test(trimmed);
}

function errorStatus(status: number): LoadStatus {
  if (status === 403) return "forbidden";
  if (status === 422) return "invalid";
  if (status === 502) return "upstream";
  return "error";
}

function statusMessage(status: LoadStatus, hasFilters: boolean, kind: "items" | "mobs") {
  if (status === "loading") return "Carregando catálogo de drops...";
  if (status === "forbidden") return "Acesso restrito a moderadores.";
  if (status === "invalid") return "Filtros inválidos. Revise o índice do item e tente novamente.";
  if (status === "upstream" || status === "error") return "web-api indisponível. Tente novamente em instantes.";
  if (status === "ok" && hasFilters) return "Nenhum resultado encontrado para os filtros atuais.";
  if (status === "ok") {
    return kind === "items"
      ? "Catálogo vazio ou indisponível. Verifique se o web-api iniciou com W2PP_CONTENT configurado."
      : "Catálogo vazio ou indisponível. Verifique se o web-api iniciou com W2PP_CONTENT configurado.";
  }
  return "";
}

function StatusBlock<T>({
  state,
  hasFilters,
  kind,
}: {
  state: LoadState<T>;
  hasFilters: boolean;
  kind: "items" | "mobs";
}) {
  if (state.status === "idle") return null;
  if (state.status === "ok" && state.data.length > 0) return null;

  return (
    <div
      style={{
        padding: "28px 18px",
        color: "var(--text-muted)",
        fontFamily: "var(--font-body)",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {statusMessage(state.status, hasFilters, kind)}
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 38,
        padding: "8px 13px",
        borderRadius: "var(--radius-sm)",
        border: active ? "1px solid var(--gold-600)" : "1px solid var(--iron-400)",
        background: active ? "rgba(185, 137, 63, 0.16)" : "var(--surface-inset)",
        color: active ? "var(--gold-300)" : "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
      aria-pressed={active}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </button>
  );
}

function buildUrl(path: string, values: Record<string, string | boolean>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "boolean") {
      if (value) params.set(key, "true");
      continue;
    }

    const trimmed = value.trim();
    if (trimmed !== "") params.set(key, trimmed);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function expandKey(mob: MobDropEntry) {
  return `${mob.templateName}\u0000${mob.mobName}\u0000${mob.mobLevel}`;
}

function RateDivisor({ value }: { value: number }) {
  return (
    <span title="divisor base do slot; maior = mais raro" style={{ fontFamily: "var(--font-mono)" }}>
      {value}
    </span>
  );
}

function ItemResults({
  items,
  expanded,
  onToggle,
}: {
  items: DropItemEntry[];
  expanded: Set<number>;
  onToggle: (itemIndex: number) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 52 }} />
            <th style={th}>Item</th>
            <th style={th}>Nome</th>
            <th style={{ ...th, textAlign: "right" }}>Mobs</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isExpanded = expanded.has(item.itemIndex);
            return (
              <Fragment key={item.itemIndex}>
                <tr>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => onToggle(item.itemIndex)}
                      title={isExpanded ? "Recolher mobs" : "Expandir mobs"}
                      aria-expanded={isExpanded}
                      style={iconButton}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--gold-300)" }}>
                    {item.itemIndex}
                  </td>
                  <td style={cell}>{item.itemName || "-"}</td>
                  <td style={{ ...cell, textAlign: "right", fontFamily: "var(--font-mono)" }}>{item.mobs.length}</td>
                </tr>
                {isExpanded ? (
                  <tr key={`${item.itemIndex}-mobs`}>
                    <td style={{ ...cell, padding: 0 }} />
                    <td colSpan={3} style={{ ...cell, padding: 0 }}>
                      {item.mobs.length === 0 ? (
                        <div style={{ padding: "12px", color: "var(--text-muted)" }}>Sem mobs para este item.</div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={th}>Mob</th>
                              <th style={th}>Template</th>
                              <th style={th}>Nível</th>
                              <th style={th}>Slot</th>
                              <th style={th}>rate_divisor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.mobs.map((mob) => (
                              <tr key={`${mob.templateName}-${mob.mobName}-${mob.slot}`}>
                                <td style={cell}>{mob.mobName || "-"}</td>
                                <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                                  {mob.templateName || "-"}
                                </td>
                                <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>{mob.mobLevel}</td>
                                <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>{mob.slot}</td>
                                <td style={cell}>
                                  <RateDivisor value={mob.rateDivisor} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobResults({
  mobs,
  expanded,
  onToggle,
}: {
  mobs: MobDropEntry[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 52 }} />
            <th style={th}>Mob</th>
            <th style={th}>Template</th>
            <th style={th}>Nível</th>
            <th style={{ ...th, textAlign: "right" }}>Itens</th>
          </tr>
        </thead>
        <tbody>
          {mobs.map((mob) => {
            const key = expandKey(mob);
            const isExpanded = expanded.has(key);
            return (
              <Fragment key={key}>
                <tr>
                  <td style={cell}>
                    <button
                      type="button"
                      onClick={() => onToggle(key)}
                      title={isExpanded ? "Recolher itens" : "Expandir itens"}
                      aria-expanded={isExpanded}
                      style={iconButton}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td style={cell}>{mob.mobName || "-"}</td>
                  <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {mob.templateName || "-"}
                  </td>
                  <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>{mob.mobLevel}</td>
                  <td style={{ ...cell, textAlign: "right", fontFamily: "var(--font-mono)" }}>{mob.items.length}</td>
                </tr>
                {isExpanded ? (
                  <tr key={`${key}-items`}>
                    <td style={{ ...cell, padding: 0 }} />
                    <td colSpan={4} style={{ ...cell, padding: 0 }}>
                      {mob.items.length === 0 ? (
                        <div style={{ padding: "12px", color: "var(--text-muted)" }}>Mob sem drops no Carry[].</div>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={th}>Slot</th>
                              <th style={th}>Item</th>
                              <th style={th}>Nome</th>
                              <th style={th}>rate_divisor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mob.items.map((item) => (
                              <tr key={`${item.slot}-${item.itemIndex}`}>
                                <td style={{ ...cell, fontFamily: "var(--font-mono)" }}>{item.slot}</td>
                                <td style={{ ...cell, fontFamily: "var(--font-mono)", color: "var(--gold-300)" }}>
                                  {item.itemIndex}
                                </td>
                                <td style={cell}>{item.itemName || "-"}</td>
                                <td style={cell}>
                                  <RateDivisor value={item.rateDivisor} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DropTool() {
  const [tab, setTab] = useState<Tab>("items");
  const [itemQuery, setItemQuery] = useState("");
  const [itemIndex, setItemIndex] = useState("");
  const [itemMobQuery, setItemMobQuery] = useState("");
  const [includeZero, setIncludeZero] = useState(false);
  const [mobQuery, setMobQuery] = useState("");
  const [mobItemQuery, setMobItemQuery] = useState("");
  const [mobItemIndex, setMobItemIndex] = useState("");
  const [itemState, setItemState] = useState<LoadState<DropItemEntry>>({ status: "idle", data: [] });
  const [mobState, setMobState] = useState<LoadState<MobDropEntry>>({ status: "idle", data: [] });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [expandedMobs, setExpandedMobs] = useState<Set<string>>(new Set());

  const itemFiltersActive = useMemo(
    () => itemQuery.trim() !== "" || itemMobQuery.trim() !== "" || hasItemIndexFilter(itemIndex),
    [itemIndex, itemMobQuery, itemQuery],
  );
  const mobFiltersActive = useMemo(
    () => mobQuery.trim() !== "" || mobItemQuery.trim() !== "" || hasItemIndexFilter(mobItemIndex),
    [mobItemIndex, mobItemQuery, mobQuery],
  );

  const loadItems = useCallback(async () => {
    setItemState((current) => ({ status: "loading", data: current.data }));
    try {
      const res = await fetch(
        buildUrl("/api/admin/drops/items", {
          itemQuery,
          itemIndex,
          mobQuery: itemMobQuery,
          includeZero,
        }),
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as { items?: DropItemEntry[] };
      if (!res.ok) {
        setItemState({ status: errorStatus(res.status), data: [] });
        return;
      }

      setExpandedItems(new Set());
      setItemState({ status: "ok", data: data.items ?? [] });
    } catch {
      setItemState({ status: "upstream", data: [] });
    }
  }, [includeZero, itemIndex, itemMobQuery, itemQuery]);

  const loadMobs = useCallback(async () => {
    setMobState((current) => ({ status: "loading", data: current.data }));
    try {
      const res = await fetch(
        buildUrl("/api/admin/drops/mobs", {
          mobQuery,
          itemQuery: mobItemQuery,
          itemIndex: mobItemIndex,
        }),
        { cache: "no-store" },
      );
      const data = (await res.json().catch(() => ({}))) as { mobs?: MobDropEntry[] };
      if (!res.ok) {
        setMobState({ status: errorStatus(res.status), data: [] });
        return;
      }

      setExpandedMobs(new Set());
      setMobState({ status: "ok", data: data.mobs ?? [] });
    } catch {
      setMobState({ status: "upstream", data: [] });
    }
  }, [mobItemIndex, mobItemQuery, mobQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === "items" && itemState.status === "idle") void loadItems();
      if (tab === "mobs" && mobState.status === "idle") void loadMobs();
    }, 0);

    return () => clearTimeout(timer);
  }, [itemState.status, loadItems, loadMobs, mobState.status, tab]);

  function submitItems(e: FormEvent) {
    e.preventDefault();
    void loadItems();
  }

  function submitMobs(e: FormEvent) {
    e.preventDefault();
    void loadMobs();
  }

  function toggleItem(item: number) {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  function toggleMob(key: string) {
    setExpandedMobs((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section style={panel}>
      <div style={toolbar}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TabButton active={tab === "items"} icon={Package} label="Por item" onClick={() => setTab("items")} />
          <TabButton active={tab === "mobs"} icon={Users} label="Por mob" onClick={() => setTab("mobs")} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.45,
          }}
        >
          <code>rate_divisor</code>: divisor base do slot; maior = mais raro.
        </div>
      </div>

      <div style={{ padding: 18 }}>
        {tab === "items" ? (
          <>
            <form onSubmit={submitItems} style={formGrid}>
              <Input
                label="Item"
                name="itemQuery"
                placeholder="nome ou índice"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
              />
              <Input
                label="Índice exato"
                name="itemIndex"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0 = todos"
                value={itemIndex}
                onChange={(e) => setItemIndex(e.target.value)}
              />
              <Input
                label="Mob"
                name="mobQuery"
                placeholder="nome ou template"
                value={itemMobQuery}
                onChange={(e) => setItemMobQuery(e.target.value)}
              />
              <div style={{ display: "grid", gap: 10 }}>
                <Checkbox
                  label="Incluir itens sem drops"
                  name="includeZero"
                  checked={includeZero}
                  onChange={(e) => setIncludeZero(e.target.checked)}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button type="submit" size="sm" disabled={itemState.status === "loading"}>
                    <Search size={15} />
                    Buscar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void loadItems()}>
                    <RefreshCw size={15} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </form>

            <StatusBlock state={itemState} hasFilters={itemFiltersActive} kind="items" />
            {itemState.data.length > 0 ? (
              <ItemResults items={itemState.data} expanded={expandedItems} onToggle={toggleItem} />
            ) : null}
          </>
        ) : (
          <>
            <form onSubmit={submitMobs} style={formGrid}>
              <Input
                label="Mob"
                name="mobQuery"
                placeholder="nome ou template"
                value={mobQuery}
                onChange={(e) => setMobQuery(e.target.value)}
              />
              <Input
                label="Item"
                name="itemQuery"
                placeholder="nome ou índice"
                value={mobItemQuery}
                onChange={(e) => setMobItemQuery(e.target.value)}
              />
              <Input
                label="Índice exato"
                name="itemIndex"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0 = todos"
                value={mobItemIndex}
                onChange={(e) => setMobItemIndex(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
                <Button type="submit" size="sm" disabled={mobState.status === "loading"}>
                  <Search size={15} />
                  Buscar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void loadMobs()}>
                  <RefreshCw size={15} />
                  Atualizar
                </Button>
              </div>
            </form>

            <StatusBlock state={mobState} hasFilters={mobFiltersActive} kind="mobs" />
            {mobState.data.length > 0 ? (
              <MobResults mobs={mobState.data} expanded={expandedMobs} onToggle={toggleMob} />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
