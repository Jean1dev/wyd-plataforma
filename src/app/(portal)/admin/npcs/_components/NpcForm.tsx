"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Input } from "@/components/ui";
import { MERCHANT_TYPES } from "@/lib/npc/domain";
import type { AdminNpc, LookupResult, MapZone, MerchantTemplate } from "@/lib/npc/types";
import { Combobox, type ComboOption } from "./Combobox";
import { PickerNote } from "./PickerNote";
import { createNpc, errorMessage, PROPAGATION_NOTICE, updateNpc, type UpsertPayload } from "./api";

type Props = {
  /** When present, the form edits an existing definition; otherwise it creates. */
  npc?: AdminNpc;
  /** Merchant templates for the template_name picker; non-ok → manual field + note. */
  templates: LookupResult<MerchantTemplate>;
  /** City zones for the map_id select; non-ok → manual numeric field + note. */
  zones: LookupResult<MapZone>;
};

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

const selectStyle: React.CSSProperties = {
  padding: "9px 11px",
  background: "var(--surface-inset)",
  border: "1px solid var(--iron-400)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-body)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

export function NpcForm({ npc, templates, zones }: Props) {
  const router = useRouter();
  const editing = Boolean(npc);

  const templateOptions: ComboOption[] = useMemo(
    () =>
      templates.data.map((t) => ({
        value: t.template_name,
        label: t.display_name || t.template_name,
        hint: t.template_name,
      })),
    [templates],
  );
  const templateByName = useMemo(
    () => new Map(templates.data.map((t) => [t.template_name, t])),
    [templates],
  );

  const [form, setForm] = useState<UpsertPayload>({
    slug: npc?.slug ?? "",
    template_name: npc?.template_name ?? "",
    display_name: npc?.display_name ?? "",
    enabled: npc?.enabled ?? true,
    map_id: npc?.map_id ?? 0,
    pos_x: npc?.pos_x ?? 0,
    pos_y: npc?.pos_y ?? 0,
    route_type: npc?.route_type ?? 0,
    merchant: npc?.merchant ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof UpsertPayload>(key: K, value: UpsertPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (editing && npc) {
        await updateNpc(npc.id, form);
        setMsg({ kind: "ok", text: PROPAGATION_NOTICE });
        router.refresh();
      } else {
        const { npc_id } = await createNpc(form);
        router.push(`/admin/npcs/${npc_id}`);
        router.refresh();
      }
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const legend: React.CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 640 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input
          label="Slug"
          name="slug"
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="Karkarian-42"
          disabled={editing}
          required
        />
        <Input
          label="Nome de exibição"
          name="display_name"
          value={form.display_name}
          onChange={(e) => set("display_name", e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <Combobox
          label="Template (merchant)"
          value={form.template_name}
          onChange={(v) => set("template_name", v)}
          onSelect={(opt) => {
            const t = templateByName.get(opt.value);
            if (t) set("merchant", t.merchant); // suggest merchant; still editable below
          }}
          options={templateOptions}
          available={templates.status === "ok"}
          placeholder="Buscar template por nome…"
          manualPlaceholder="ex. merchant_karkarian"
          manualHint="Deve bater exatamente com um arquivo em Release/TMsrv/run/npc/ (sem .txt)."
        />
        <PickerNote
          status={templates.status}
          rpc="ListMerchantTemplates"
          contentDependent
          manualHint="Digite o template_name manualmente — deve bater com um arquivo em Release/TMsrv/run/npc/ (sem .txt)."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <label style={field}>
          <span style={legend}>Cidade (map_id)</span>
          {zones.status === "ok" ? (
            <select style={selectStyle} value={form.map_id} onChange={(e) => set("map_id", num(e.target.value))}>
              {/* Keep an out-of-range existing value visible instead of silently snapping it. */}
              {zones.data.some((z) => z.id === form.map_id) ? null : (
                <option value={form.map_id}>#{form.map_id} (fora da lista)</option>
              )}
              {zones.data.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} · {z.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              value={form.map_id}
              onChange={(e) => set("map_id", num(e.target.value))}
              style={selectStyle}
            />
          )}
        </label>
        <Input label="Pos X" name="pos_x" type="number" value={form.pos_x} onChange={(e) => set("pos_x", num(e.target.value))} />
        <Input label="Pos Y" name="pos_y" type="number" value={form.pos_y} onChange={(e) => set("pos_y", num(e.target.value))} />
      </div>

      <PickerNote
        status={zones.status}
        rpc="ListMapZones"
        manualHint="Digite o map_id manualmente (0–4). Hoje é só rótulo — o spawn depende de Pos X/Y."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <label style={field}>
          <span style={legend}>Tipo (merchant)</span>
          <select style={selectStyle} value={form.merchant} onChange={(e) => set("merchant", num(e.target.value))}>
            {MERCHANT_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Rota (0 = parado)"
          name="route_type"
          type="number"
          value={form.route_type}
          onChange={(e) => set("route_type", num(e.target.value))}
        />
      </div>

      <Checkbox
        label="Visível no jogo (aparece ou não)"
        name="enabled"
        checked={form.enabled}
        onChange={(e) => set("enabled", e.target.checked)}
      />

      {msg ? (
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            color: msg.kind === "ok" ? "var(--emerald-400)" : "var(--danger-400, #d97b7b)",
          }}
        >
          {msg.text}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <Button type="submit" disabled={busy}>
          {editing ? "Salvar definição" : "Criar NPC"}
        </Button>
        <Button href="/admin/npcs" variant="ghost">
          Voltar
        </Button>
      </div>
    </form>
  );
}

export default NpcForm;
