"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import type { AdminMobTemplateStat } from "@/lib/mob-template/types";
import { expWarning, sanitizeExpString } from "@/lib/mob-template/domain";
import { errorMessage, SAVE_NOTICE, updateMobTemplateStat, type StatPayload } from "./api";

type Props = { stat: AdminMobTemplateStat };

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function toPayload(stat: AdminMobTemplateStat): StatPayload {
  return {
    display_name: stat.display_name,
    clan: stat.clan,
    merchant: stat.merchant,
    class: stat.class,
    coin: stat.coin,
    exp: stat.exp,
    spx: stat.spx,
    spy: stat.spy,
    level: stat.level,
    ac: stat.ac,
    damage: stat.damage,
    chaos_rate: stat.chaos_rate,
    attack_run: stat.attack_run,
    direction: stat.direction,
    str: stat.str,
    intel: stat.intel,
    dex: stat.dex,
    con: stat.con,
    special1: stat.special1,
    special2: stat.special2,
    special3: stat.special3,
    special4: stat.special4,
    max_hp: stat.max_hp,
    hp: stat.hp,
    max_mp: stat.max_mp,
    mp: stat.mp,
    learned_skill: stat.learned_skill,
    score_bonus: stat.score_bonus,
    skill_bar1: stat.skill_bar1,
    skill_bar2: stat.skill_bar2,
    skill_bar3: stat.skill_bar3,
    skill_bar4: stat.skill_bar4,
    regen_hp: stat.regen_hp,
    regen_mp: stat.regen_mp,
    resist1: stat.resist1,
    resist2: stat.resist2,
    resist3: stat.resist3,
    resist4: stat.resist4,
  };
}

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
  gap: 14,
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
  fontSize: 12,
  color: "var(--text-muted)",
  lineHeight: 1.45,
  margin: 0,
};

export function StatForm({ stat }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<StatPayload>(() => toPayload(stat));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function set<K extends keyof StatPayload>(key: K, value: StatPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const warning = useMemo(
    () => expWarning({ level: form.level, merchant: form.merchant, exp: form.exp }),
    [form.level, form.merchant, form.exp],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await updateMobTemplateStat(stat.template_name, { ...form, exp: sanitizeExpString(form.exp) });
      setMsg({ kind: "ok", text: SAVE_NOTICE });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 22 }}>
      <div
        style={{
          display: "inline-flex",
          alignSelf: "start",
          padding: "5px 9px",
          borderRadius: "var(--radius-sm)",
          border: stat.overridden ? "1px solid var(--gold-700)" : "1px solid var(--iron-400)",
          background: stat.overridden ? "rgba(200,163,91,0.12)" : "rgba(10,8,5,0.35)",
          color: stat.overridden ? "var(--gold-300)" : "var(--text-muted)",
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {stat.overridden ? "Customizado (override salvo)" : "Usando valores do arquivo (sem customização)"}
      </div>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Identidade</h2>
        <div style={grid}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Nome de exibição"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="(mantém o nome original do arquivo se vazio)"
            />
          </div>
          <Input label="Clan" type="number" value={form.clan} onChange={(e) => set("clan", num(e.target.value))} />
          <div style={{ display: "grid", gap: 4 }}>
            <Input
              label="Tipo de merchant (template)"
              type="number"
              value={form.merchant}
              onChange={(e) => set("merchant", num(e.target.value))}
            />
            <span style={helperText}>Distinto do &quot;merchant&quot; da definição do NPC (posição/loja).</span>
          </div>
          <Input label="Class" type="number" value={form.class} onChange={(e) => set("class", num(e.target.value))} />
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Economia</h2>
        <div style={grid}>
          <Input label="Coin" type="number" value={form.coin} onChange={(e) => set("coin", num(e.target.value))} />
          <div style={{ display: "grid", gap: 4 }}>
            <Input label="EXP" type="number" value={form.exp} onChange={(e) => set("exp", e.target.value)} />
            {warning ? <span style={{ ...helperText, color: "var(--gold-400)" }}>{warning}</span> : null}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Posição</h2>
        <div style={grid}>
          <Input label="SPX" type="number" value={form.spx} onChange={(e) => set("spx", num(e.target.value))} />
          <Input label="SPY" type="number" value={form.spy} onChange={(e) => set("spy", num(e.target.value))} />
        </div>
        <span style={helperText}>
          Posição embutida no template — distinta do Pos X/Y da definição do NPC (banco de dados).
        </span>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Combate</h2>
        <div style={grid}>
          <Input label="Level" type="number" value={form.level} onChange={(e) => set("level", num(e.target.value))} />
          <Input label="AC" type="number" value={form.ac} onChange={(e) => set("ac", num(e.target.value))} />
          <Input label="Damage" type="number" value={form.damage} onChange={(e) => set("damage", num(e.target.value))} />
          <Input
            label="Chaos rate"
            type="number"
            value={form.chaos_rate}
            onChange={(e) => set("chaos_rate", num(e.target.value))}
          />
          <Input
            label="Attack run"
            type="number"
            value={form.attack_run}
            onChange={(e) => set("attack_run", num(e.target.value))}
          />
          <Input
            label="Direction (0-7)"
            type="number"
            min={0}
            max={7}
            value={form.direction}
            onChange={(e) => set("direction", num(e.target.value))}
          />
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Atributos</h2>
        <div style={grid}>
          <Input label="Str" type="number" value={form.str} onChange={(e) => set("str", num(e.target.value))} />
          <Input
            label="Inteligência"
            type="number"
            value={form.intel}
            onChange={(e) => set("intel", num(e.target.value))}
          />
          <Input label="Dex" type="number" value={form.dex} onChange={(e) => set("dex", num(e.target.value))} />
          <Input label="Con" type="number" value={form.con} onChange={(e) => set("con", num(e.target.value))} />
          <Input
            label="Special 1"
            type="number"
            value={form.special1}
            onChange={(e) => set("special1", num(e.target.value))}
          />
          <Input
            label="Special 2"
            type="number"
            value={form.special2}
            onChange={(e) => set("special2", num(e.target.value))}
          />
          <Input
            label="Special 3"
            type="number"
            value={form.special3}
            onChange={(e) => set("special3", num(e.target.value))}
          />
          <Input
            label="Special 4"
            type="number"
            value={form.special4}
            onChange={(e) => set("special4", num(e.target.value))}
          />
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Combate (vida)</h2>
        <div style={grid}>
          <Input label="Max HP" type="number" value={form.max_hp} onChange={(e) => set("max_hp", num(e.target.value))} />
          <Input label="HP" type="number" value={form.hp} onChange={(e) => set("hp", num(e.target.value))} />
          <Input label="Max MP" type="number" value={form.max_mp} onChange={(e) => set("max_mp", num(e.target.value))} />
          <Input label="MP" type="number" value={form.mp} onChange={(e) => set("mp", num(e.target.value))} />
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={sectionTitle}>Skills</h2>
        <div style={grid}>
          <Input
            label="Learned skill"
            type="number"
            value={form.learned_skill}
            onChange={(e) => set("learned_skill", num(e.target.value))}
          />
          <Input
            label="Score bonus"
            type="number"
            value={form.score_bonus}
            onChange={(e) => set("score_bonus", num(e.target.value))}
          />
          <Input
            label="Skill bar 1"
            type="number"
            value={form.skill_bar1}
            onChange={(e) => set("skill_bar1", num(e.target.value))}
          />
          <Input
            label="Skill bar 2"
            type="number"
            value={form.skill_bar2}
            onChange={(e) => set("skill_bar2", num(e.target.value))}
          />
          <Input
            label="Skill bar 3"
            type="number"
            value={form.skill_bar3}
            onChange={(e) => set("skill_bar3", num(e.target.value))}
          />
          <Input
            label="Skill bar 4"
            type="number"
            value={form.skill_bar4}
            onChange={(e) => set("skill_bar4", num(e.target.value))}
          />
          <Input
            label="Regen HP"
            type="number"
            value={form.regen_hp}
            onChange={(e) => set("regen_hp", num(e.target.value))}
          />
          <Input
            label="Regen MP"
            type="number"
            value={form.regen_mp}
            onChange={(e) => set("regen_mp", num(e.target.value))}
          />
          <Input
            label="Resist 1"
            type="number"
            value={form.resist1}
            onChange={(e) => set("resist1", num(e.target.value))}
          />
          <Input
            label="Resist 2"
            type="number"
            value={form.resist2}
            onChange={(e) => set("resist2", num(e.target.value))}
          />
          <Input
            label="Resist 3"
            type="number"
            value={form.resist3}
            onChange={(e) => set("resist3", num(e.target.value))}
          />
          <Input
            label="Resist 4"
            type="number"
            value={form.resist4}
            onChange={(e) => set("resist4", num(e.target.value))}
          />
        </div>
        <span style={helperText}>Resist aceita valores negativos.</span>
      </section>

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

      <div>
        <Button type="submit" disabled={busy}>
          Salvar stats
        </Button>
      </div>
    </form>
  );
}

export default StatForm;
