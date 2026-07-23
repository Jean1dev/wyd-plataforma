"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Power, RefreshCw, Save, ShieldAlert, Zap } from "lucide-react";
import { Button, Checkbox, Input } from "@/components/ui";
import type { WorldEventConfigJson, WorldEventStatus } from "@/lib/world-events/types";
import {
  emptyWorldEventConfig,
  validateWorldEventConfig,
  worldEventStatus,
} from "@/lib/world-events/validation";
import {
  fetchWorldEventConfig,
  saveWorldEventConfig,
  worldEventError,
  worldEventErrorMessage,
} from "./api";

type LoadStatus = "loading" | "ready" | "forbidden" | "upstream" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "invalid" | "conflict" | "forbidden" | "upstream" | "error";

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

const content: CSSProperties = {
  padding: 18,
  display: "grid",
  gap: 18,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: 14,
  alignItems: "end",
};

const sectionTitle: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--gold-400)",
  margin: 0,
};

const helperText: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--text-muted)",
  lineHeight: 1.45,
  margin: 0,
};

function toInt(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function sameConfig(a: WorldEventConfigJson, b: WorldEventConfigJson): boolean {
  return (
    a.enabled === b.enabled &&
    a.itemIndex === b.itemIndex &&
    a.rate === b.rate &&
    a.startIndex === b.startIndex &&
    a.currentIndex === b.currentIndex &&
    a.endIndex === b.endIndex &&
    a.indexed === b.indexed &&
    a.noticeEnabled === b.noticeEnabled &&
    a.doubleExpEnabled === b.doubleExpEnabled &&
    a.newbieEventEnabled === b.newbieEventEnabled
  );
}

function statusMeta(status: WorldEventStatus) {
  if (status === "active") {
    return { label: "Ativo", color: "var(--emerald-400)", icon: Zap };
  }
  if (status === "exhausted") {
    return { label: "Esgotado", color: "var(--gold-400)", icon: AlertTriangle };
  }
  return { label: "Desligado", color: "var(--text-muted)", icon: Power };
}

function validationMessage(error: string): string {
  const messages: Record<string, string> = {
    "itemIndex must be at most 32767": "Item index deve ser no máximo 32767.",
    "itemIndex must be greater than 0 when enabled": "Item index deve ser maior que 0 quando o drop está ligado.",
    "rate must be greater than 0 when enabled": "Divisor de chance deve ser maior que 0 quando o drop está ligado.",
    "startIndex must be greater than 0 when enabled": "Início deve ser maior que 0 quando o drop está ligado.",
    "endIndex must be greater than startIndex when enabled": "Fim deve ser maior que o início quando o drop está ligado.",
    "currentIndex must be greater than or equal to startIndex when enabled":
      "Atual deve ser maior ou igual ao início quando o drop está ligado.",
    "currentIndex must be less than or equal to endIndex when enabled":
      "Atual deve ser menor ou igual ao fim quando o drop está ligado.",
  };

  if (error.endsWith("cannot be negative")) return "Campos numéricos não podem ser negativos.";
  if (error.endsWith("must be an integer")) return "Campos numéricos devem ser inteiros.";
  return messages[error] ?? "Configuração inválida.";
}

function StatusPill({ status }: { status: WorldEventStatus }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 32,
        padding: "6px 11px",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-inset)",
        color: meta.color,
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <Icon size={15} strokeWidth={2} />
      {meta.label}
    </span>
  );
}

function Message({ kind, children }: { kind: "ok" | "warn" | "error"; children: string }) {
  const color =
    kind === "ok" ? "var(--emerald-400)" : kind === "warn" ? "var(--gold-400)" : "var(--blood-400)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 12px",
        border: "1px solid var(--iron-400)",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-inset)",
        color,
        fontFamily: "var(--font-body)",
        fontSize: 14,
      }}
    >
      {kind === "ok" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {children}
    </div>
  );
}

function BlockingState({
  status,
  onReload,
}: {
  status: Exclude<LoadStatus, "ready">;
  onReload: () => void;
}) {
  const text =
    status === "loading"
      ? "Carregando configuração..."
      : status === "forbidden"
        ? "Acesso restrito a moderadores."
        : "web-api indisponível. Tente novamente em instantes.";

  return (
    <div style={{ ...panel, padding: 24, display: "grid", gap: 14, maxWidth: 680 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-body)" }}>
        {status === "forbidden" ? <ShieldAlert size={20} /> : <RefreshCw size={20} />}
        <span style={{ fontFamily: "var(--font-body)", fontSize: 15 }}>{text}</span>
      </div>
      {status !== "loading" && status !== "forbidden" ? (
        <div>
          <Button type="button" variant="steel" onClick={onReload}>
            <RefreshCw size={16} />
            Recarregar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function WorldEventConfigTool() {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [version, setVersion] = useState("0");
  const [form, setForm] = useState<WorldEventConfigJson>(emptyWorldEventConfig);
  const [saved, setSaved] = useState<WorldEventConfigJson>(emptyWorldEventConfig);

  const dirty = useMemo(() => !sameConfig(form, saved), [form, saved]);
  const validation = useMemo(() => validateWorldEventConfig(form), [form]);
  const currentStatus = useMemo(() => worldEventStatus(form), [form]);
  const rateText = form.rate > 0 ? `1 em ${form.rate} kills elegíveis` : "Defina um divisor maior que 0";

  const load = useCallback(async () => {
    setLoadStatus("loading");
    setSaveStatus("idle");
    setSaveMessage(null);
    try {
      const data = await fetchWorldEventConfig();
      setVersion(data.version);
      setForm(data.config);
      setSaved(data.config);
      setLoadStatus("ready");
    } catch (err) {
      const e = worldEventError(err);
      setLoadStatus(e.status === 403 ? "forbidden" : e.status === 502 ? "upstream" : "error");
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const data = await fetchWorldEventConfig();
        if (ignore) return;
        setVersion(data.version);
        setForm(data.config);
        setSaved(data.config);
        setLoadStatus("ready");
      } catch (err) {
        if (ignore) return;
        const e = worldEventError(err);
        setLoadStatus(e.status === 403 ? "forbidden" : e.status === 502 ? "upstream" : "error");
      }
    }

    void loadInitial();

    return () => {
      ignore = true;
    };
  }, []);

  function set<K extends keyof WorldEventConfigJson>(key: K, value: WorldEventConfigJson[K]) {
    setSaveStatus("idle");
    setSaveMessage(null);
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const valid = validateWorldEventConfig(form);
    if (!valid.ok) {
      setSaveStatus("invalid");
      setSaveMessage(validationMessage(valid.error));
      return;
    }

    setSaveStatus("saving");
    setSaveMessage(null);
    try {
      const data = await saveWorldEventConfig({ version, config: form });
      setVersion(data.version);
      setForm(data.config);
      setSaved(data.config);
      setSaveStatus("saved");
      setSaveMessage("Configuração salva.");
    } catch (err) {
      const e = worldEventError(err);
      if (e.status === 409) {
        setSaveStatus("conflict");
      } else if (e.status === 403) {
        setSaveStatus("forbidden");
      } else if (e.status === 502) {
        setSaveStatus("upstream");
      } else if (e.status === 422) {
        setSaveStatus("invalid");
      } else {
        setSaveStatus("error");
      }
      setSaveMessage(worldEventErrorMessage(err));
    }
  }

  if (loadStatus !== "ready") {
    return <BlockingState status={loadStatus} onReload={load} />;
  }

  return (
    <form onSubmit={submit} style={panel}>
      <div style={toolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusPill status={currentStatus} />
          <span style={{ ...helperText, fontFamily: "var(--font-mono)" }}>version {version}</span>
          {dirty ? <span style={{ ...helperText, color: "var(--gold-400)" }}>Alterações não salvas</span> : null}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="button" variant="steel" onClick={load} disabled={saveStatus === "saving"}>
            <RefreshCw size={16} />
            Recarregar
          </Button>
          <Button type="submit" disabled={saveStatus === "saving" || !dirty || !validation.ok}>
            <Save size={16} />
            {saveStatus === "saving" ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div style={content}>
        {currentStatus === "exhausted" ? <Message kind="warn">Evento esgotado.</Message> : null}
        {!validation.ok ? <Message kind="error">{validationMessage(validation.error)}</Message> : null}
        {saveMessage ? (
          <Message kind={saveStatus === "saved" ? "ok" : saveStatus === "conflict" ? "warn" : "error"}>
            {saveMessage}
          </Message>
        ) : null}

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={sectionTitle}>Drop global</h2>
          <div style={grid}>
            <Checkbox
              label="Drop global habilitado"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            <Input
              label="Item index"
              type="number"
              min={0}
              max={32767}
              step={1}
              value={form.itemIndex}
              onChange={(e) => set("itemIndex", toInt(e.target.value))}
            />
            <div style={{ display: "grid", gap: 6 }}>
              <Input
                label="Divisor de chance"
                type="number"
                min={0}
                step={1}
                value={form.rate}
                onChange={(e) => set("rate", toInt(e.target.value))}
              />
              <span style={helperText}>{rateText}</span>
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={sectionTitle}>Progresso</h2>
          <div style={grid}>
            <Input
              label="Início"
              type="number"
              min={0}
              step={1}
              value={form.startIndex}
              onChange={(e) => set("startIndex", toInt(e.target.value))}
            />
            <Input
              label="Atual"
              type="number"
              min={0}
              step={1}
              value={form.currentIndex}
              onChange={(e) => set("currentIndex", toInt(e.target.value))}
            />
            <Input
              label="Fim"
              type="number"
              min={0}
              step={1}
              value={form.endIndex}
              onChange={(e) => set("endIndex", toInt(e.target.value))}
            />
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          <h2 style={sectionTitle}>Flags</h2>
          <div style={grid}>
            <Checkbox label="Serial indexado" checked={form.indexed} onChange={(e) => set("indexed", e.target.checked)} />
            <Checkbox
              label="Anunciar drop"
              checked={form.noticeEnabled}
              onChange={(e) => set("noticeEnabled", e.target.checked)}
            />
            <Checkbox
              label="EXP dobrada"
              checked={form.doubleExpEnabled}
              onChange={(e) => set("doubleExpEnabled", e.target.checked)}
            />
            <Checkbox
              label="Evento newbie"
              checked={form.newbieEventEnabled}
              onChange={(e) => set("newbieEventEnabled", e.target.checked)}
            />
          </div>
        </section>
      </div>
    </form>
  );
}
