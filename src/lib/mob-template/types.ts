// Pure mob-template domain types shared between server (gRPC client) and
// client components. Keep this module free of "server-only" so the browser
// can import it for props/state typing.

export type AdminResult =
  | "ADMIN_RESULT_UNSPECIFIED"
  | "ADMIN_RESULT_OK"
  | "ADMIN_RESULT_FORBIDDEN"
  | "ADMIN_RESULT_INVALID"
  | "ADMIN_RESULT_NOT_FOUND";

// A file under Release/TMsrv/run/npc/, NOT filtered by merchant type (unlike
// NpcAdminService's ListMerchantTemplates) — includes every mob template.
export type MobTemplateFile = {
  template_name: string;
  display_name: string;
  merchant: number;
};

// One of Equip[16] (MAX_EQUIP) on the mob template.
export type AdminMobTemplateEquipItem = {
  slot: number;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
};

// Full combat-stat form (GetMobTemplateStat/UpsertMobTemplateStat). `exp` is
// the template's only int64 field — the proto loader surfaces int64 as a JS
// string (see channel.ts's `longs: String`), so it stays a string end to end.
export type AdminMobTemplateStat = {
  template_name: string;
  // Set only on GetMobTemplateStat's response; ignored on Upsert. false = no
  // saved override yet, values are read straight from the raw npc/ file —
  // a normal state, not an error or an empty form.
  overridden: boolean;

  display_name: string;
  clan: number;
  // Raw STRUCT_MOB.Merchant on the TEMPLATE — distinct from
  // NpcAdminService.AdminNpc.merchant (the spawned NPC definition's merchant
  // type). Same field name, different meaning; label separately in the UI.
  merchant: number;
  class: number;

  coin: number;
  exp: string;

  // Template-embedded spawn point; NOT npc_definition's pos_x/pos_y.
  spx: number;
  spy: number;

  level: number;
  ac: number;
  damage: number;
  chaos_rate: number;
  attack_run: number;
  direction: number; // 0-7

  str: number;
  intel: number; // "int" is a reserved word
  dex: number;
  con: number;
  special1: number;
  special2: number;
  special3: number;
  special4: number;

  max_hp: number;
  hp: number;
  max_mp: number;
  mp: number;

  learned_skill: number;
  score_bonus: number;
  skill_bar1: number;
  skill_bar2: number;
  skill_bar3: number;
  skill_bar4: number;
  regen_hp: number;
  regen_mp: number;
  resist1: number; // signed, negative valid
  resist2: number;
  resist3: number;
  resist4: number;

  equip: AdminMobTemplateEquipItem[];
};
