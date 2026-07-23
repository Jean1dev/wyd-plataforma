import type { AdminMobTemplateEquipItem, AdminMobTemplateStat } from "@/lib/mob-template/types";
import { EQUIP_SLOT_COUNT, sanitizeExpString } from "@/lib/mob-template/domain";
import { int, text } from "@/lib/web-api/body-parse";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

// Mirrors the web-api's validation for UX; the web-api stays the authority.
// template_name always comes from the URL, never the body. equip is a
// sub-resource written only via SetMobTemplateEquip — Upsert never touches it.
export function parseMobTemplateStatBody(raw: unknown, templateName: string): Parsed<AdminMobTemplateStat> {
  if (!raw || typeof raw !== "object") return { ok: false, error: "body_invalid" };
  const b = raw as Record<string, unknown>;

  const stat: AdminMobTemplateStat = {
    template_name: templateName,
    overridden: false,

    display_name: text(b.display_name),
    clan: int(b.clan),
    merchant: int(b.merchant),
    class: int(b.class),

    coin: int(b.coin),
    exp: sanitizeExpString(b.exp),

    spx: int(b.spx),
    spy: int(b.spy),

    level: int(b.level),
    ac: int(b.ac),
    damage: int(b.damage),
    chaos_rate: int(b.chaos_rate),
    attack_run: int(b.attack_run),
    direction: int(b.direction),

    str: int(b.str),
    intel: int(b.intel),
    dex: int(b.dex),
    con: int(b.con),
    special1: int(b.special1),
    special2: int(b.special2),
    special3: int(b.special3),
    special4: int(b.special4),

    max_hp: int(b.max_hp),
    hp: int(b.hp),
    max_mp: int(b.max_mp),
    mp: int(b.mp),

    learned_skill: int(b.learned_skill),
    score_bonus: int(b.score_bonus),
    skill_bar1: int(b.skill_bar1),
    skill_bar2: int(b.skill_bar2),
    skill_bar3: int(b.skill_bar3),
    skill_bar4: int(b.skill_bar4),
    regen_hp: int(b.regen_hp),
    regen_mp: int(b.regen_mp),
    resist1: int(b.resist1),
    resist2: int(b.resist2),
    resist3: int(b.resist3),
    resist4: int(b.resist4),

    equip: [],
  };

  if (!stat.template_name) return { ok: false, error: "template_name_required" };
  if (stat.direction < 0 || stat.direction > 7) return { ok: false, error: "direction_invalid" };

  return { ok: true, value: stat };
}

// Parses and validates the full equip list (SetMobTemplateEquip replaces the
// whole Equip[16]). Mirrors the web-api validation: unique slots in
// [0, EQUIP_SLOT_COUNT-1], item_index > 0.
export function parseMobTemplateEquipItems(raw: unknown): Parsed<AdminMobTemplateEquipItem[]> {
  if (!Array.isArray(raw)) return { ok: false, error: "items_required" };

  const seen = new Set<number>();
  const items: AdminMobTemplateEquipItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return { ok: false, error: "item_invalid" };
    const e = entry as Record<string, unknown>;

    const slot = int(e.slot);
    const item_index = int(e.item_index);
    if (slot < 0 || slot >= EQUIP_SLOT_COUNT) return { ok: false, error: "slot_out_of_range" };
    if (seen.has(slot)) return { ok: false, error: "slot_duplicated" };
    if (item_index <= 0) return { ok: false, error: "item_index_invalid" };
    seen.add(slot);

    items.push({
      slot,
      item_index,
      eff1: int(e.eff1),
      effv1: int(e.effv1),
      eff2: int(e.eff2),
      effv2: int(e.effv2),
      eff3: int(e.eff3),
      effv3: int(e.effv3),
    });
  }

  return { ok: true, value: items };
}
