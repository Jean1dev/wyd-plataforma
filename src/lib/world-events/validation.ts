import type { WorldEventConfigJson, WorldEventConfigProto, WorldEventStatus } from "./types";

const NUMERIC_KEYS = ["itemIndex", "rate", "startIndex", "currentIndex", "endIndex"] as const;
const BOOLEAN_KEYS = [
  "enabled",
  "indexed",
  "noticeEnabled",
  "doubleExpEnabled",
  "newbieEventEnabled",
] as const;

type NumericKey = (typeof NUMERIC_KEYS)[number];
type BooleanKey = (typeof BOOLEAN_KEYS)[number];

export type WorldEventValidation = { ok: true } | { ok: false; error: string };
export type ParsedWorldEventPut =
  | { ok: true; value: { version: string; config: WorldEventConfigJson } }
  | { ok: false; error: string };

export const emptyWorldEventConfig: WorldEventConfigJson = {
  enabled: false,
  itemIndex: 0,
  rate: 0,
  startIndex: 0,
  currentIndex: 0,
  endIndex: 0,
  indexed: false,
  noticeEnabled: false,
  doubleExpEnabled: false,
  newbieEventEnabled: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(source: Record<string, unknown>, key: NumericKey): number | null {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    return null;
  }
  return value;
}

function readBoolean(source: Record<string, unknown>, key: BooleanKey): boolean | null {
  const value = source[key];
  return typeof value === "boolean" ? value : null;
}

export function validateWorldEventConfig(config: WorldEventConfigJson): WorldEventValidation {
  for (const key of NUMERIC_KEYS) {
    if (!Number.isInteger(config[key]) || !Number.isSafeInteger(config[key])) {
      return { ok: false, error: `${key} must be an integer` };
    }
    if (config[key] < 0) {
      return { ok: false, error: `${key} cannot be negative` };
    }
  }

  if (config.itemIndex > 32767) {
    return { ok: false, error: "itemIndex must be at most 32767" };
  }

  if (!config.enabled) {
    return { ok: true };
  }

  if (config.itemIndex <= 0) return { ok: false, error: "itemIndex must be greater than 0 when enabled" };
  if (config.rate <= 0) return { ok: false, error: "rate must be greater than 0 when enabled" };
  if (config.startIndex <= 0) return { ok: false, error: "startIndex must be greater than 0 when enabled" };
  if (config.endIndex <= config.startIndex) {
    return { ok: false, error: "endIndex must be greater than startIndex when enabled" };
  }
  if (config.currentIndex < config.startIndex) {
    return { ok: false, error: "currentIndex must be greater than or equal to startIndex when enabled" };
  }
  if (config.currentIndex > config.endIndex) {
    return { ok: false, error: "currentIndex must be less than or equal to endIndex when enabled" };
  }

  return { ok: true };
}

export function parseWorldEventPutBody(body: unknown): ParsedWorldEventPut {
  if (!isRecord(body)) {
    return { ok: false, error: "invalid_body" };
  }

  const version = body.version;
  const rawConfig = body.config;
  if (typeof version !== "string" || version.trim() === "" || !/^\d+$/.test(version.trim())) {
    return { ok: false, error: "invalid_version" };
  }
  if (!isRecord(rawConfig)) {
    return { ok: false, error: "invalid_config" };
  }

  const config = { ...emptyWorldEventConfig };
  for (const key of NUMERIC_KEYS) {
    const value = readNumber(rawConfig, key);
    if (value === null) return { ok: false, error: `invalid_${key}` };
    config[key] = value;
  }
  for (const key of BOOLEAN_KEYS) {
    const value = readBoolean(rawConfig, key);
    if (value === null) return { ok: false, error: `invalid_${key}` };
    config[key] = value;
  }

  const valid = validateWorldEventConfig(config);
  if (!valid.ok) return valid;

  return { ok: true, value: { version: version.trim(), config } };
}

export function worldEventStatus(config: WorldEventConfigJson): WorldEventStatus {
  if (!config.enabled) return "disabled";
  return config.currentIndex >= config.endIndex ? "exhausted" : "active";
}

export function protoToWorldEventConfig(config?: Partial<WorldEventConfigProto> | null): WorldEventConfigJson {
  return {
    enabled: Boolean(config?.enabled),
    itemIndex: Number(config?.item_index ?? 0),
    rate: Number(config?.rate ?? 0),
    startIndex: Number(config?.start_index ?? 0),
    currentIndex: Number(config?.current_index ?? 0),
    endIndex: Number(config?.end_index ?? 0),
    indexed: Boolean(config?.indexed),
    noticeEnabled: Boolean(config?.notice_enabled),
    doubleExpEnabled: Boolean(config?.double_exp_enabled),
    newbieEventEnabled: Boolean(config?.newbie_event_enabled),
  };
}

export function worldEventConfigToProto(config: WorldEventConfigJson): WorldEventConfigProto {
  return {
    enabled: config.enabled,
    item_index: config.itemIndex,
    rate: config.rate,
    start_index: config.startIndex,
    current_index: config.currentIndex,
    end_index: config.endIndex,
    indexed: config.indexed,
    notice_enabled: config.noticeEnabled,
    double_exp_enabled: config.doubleExpEnabled,
    newbie_event_enabled: config.newbieEventEnabled,
  };
}

