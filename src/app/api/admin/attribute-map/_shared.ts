import { NextResponse } from "next/server";
import {
  ATTRIBUTE_MAP_SIZE,
  ATTRIBUTE_MAP_WORLD_MAX,
  type AttributeMapInfo,
  type AttributeMapRect,
  type AttributeMapTransformFilter,
  type AttributeMapTransformInput,
  type AttributeMapTransformOperation,
} from "@/lib/attribute-map/types";
import type {
  GetAttributeMapInfoResponse,
  TransformAttributeMapResponse,
} from "@/lib/web-api/attribute-map-admin-client";
import { httpForAdminResult } from "@/lib/web-api/admin-http";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const OPERATIONS = new Set<AttributeMapTransformOperation>([
  "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS",
  "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE",
  "ATTRIBUTE_MAP_TRANSFORM_OPERATION_SET_BITS",
  "ATTRIBUTE_MAP_TRANSFORM_OPERATION_CLEAR_BITS",
  "ATTRIBUTE_MAP_TRANSFORM_OPERATION_TOGGLE_BITS",
]);

export const SNAPSHOT_REQUEST: AttributeMapTransformInput = {
  operation: "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE",
  operand: 0,
  filter: { enabled: true, exact_value: 0, mask: 0, match_value: 0 },
};

function intField(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}

function objectField(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseByte(value: unknown, error: string): Parsed<number> {
  const n = intField(value);
  if (n == null || n < 0 || n > 255) return { ok: false, error };
  return { ok: true, value: n };
}

function parseRect(value: unknown): Parsed<AttributeMapRect | undefined> {
  if (value == null) return { ok: true, value: undefined };

  const rect = objectField(value);
  if (!rect) return { ok: false, error: "rect_invalid" };

  const minX = intField(rect.min_x);
  const minY = intField(rect.min_y);
  const maxX = intField(rect.max_x);
  const maxY = intField(rect.max_y);
  if (minX == null || minY == null || maxX == null || maxY == null) {
    return { ok: false, error: "rect_invalid" };
  }
  if (
    minX < 0 ||
    minY < 0 ||
    maxX < 0 ||
    maxY < 0 ||
    minX > ATTRIBUTE_MAP_WORLD_MAX ||
    minY > ATTRIBUTE_MAP_WORLD_MAX ||
    maxX > ATTRIBUTE_MAP_WORLD_MAX ||
    maxY > ATTRIBUTE_MAP_WORLD_MAX ||
    minX > maxX ||
    minY > maxY
  ) {
    return { ok: false, error: "rect_invalid" };
  }

  return { ok: true, value: { min_x: minX, min_y: minY, max_x: maxX, max_y: maxY } };
}

function parseFilter(value: unknown): Parsed<AttributeMapTransformFilter | undefined> {
  if (value == null) return { ok: true, value: undefined };

  const filter = objectField(value);
  if (!filter) return { ok: false, error: "filter_invalid" };
  if (filter.enabled !== true) return { ok: true, value: undefined };

  const mask = parseByte(filter.mask, "filter_mask_invalid");
  if (!mask.ok) return mask;

  if (mask.value === 0) {
    const exact = parseByte(filter.exact_value, "filter_exact_value_invalid");
    if (!exact.ok) return exact;
    return {
      ok: true,
      value: { enabled: true, exact_value: exact.value, mask: 0, match_value: 0 },
    };
  }

  const match = parseByte(filter.match_value, "filter_match_value_invalid");
  if (!match.ok) return match;
  return {
    ok: true,
    value: { enabled: true, exact_value: 0, mask: mask.value, match_value: match.value },
  };
}

export function parseTransformBody(raw: unknown): Parsed<AttributeMapTransformInput> {
  const body = objectField(raw);
  if (!body) return { ok: false, error: "body_invalid" };

  const operation = body.operation;
  if (typeof operation !== "string" || !OPERATIONS.has(operation as AttributeMapTransformOperation)) {
    return { ok: false, error: "operation_invalid" };
  }

  const op = operation as AttributeMapTransformOperation;
  const operand: Parsed<number> =
    op === "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS"
      ? { ok: true, value: 0 }
      : parseByte(body.operand, "operand_invalid");
  if (!operand.ok) return operand;
  if (
    op !== "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS" &&
    op !== "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE" &&
    operand.value < 1
  ) {
    return { ok: false, error: "operand_invalid" };
  }

  const rect = parseRect(body.rect);
  if (!rect.ok) return rect;

  const filter = parseFilter(body.filter);
  if (!filter.ok) return filter;

  return {
    ok: true,
    value: {
      operation: op,
      operand: op === "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS" ? 0 : operand.value,
      ...(rect.value ? { rect: rect.value } : {}),
      ...(filter.value ? { filter: filter.value } : {}),
    },
  };
}

export function normalizeHistogram(histogram: { value: number; count: string | number }[] | undefined) {
  return Array.from({ length: 256 }, (_, value) => ({ value, count: 0 })).map((bucket) => {
    const found = histogram?.find((entry) => entry.value === bucket.value);
    if (!found) return bucket;
    const count = typeof found.count === "number" ? found.count : Number(found.count);
    return { value: bucket.value, count: Number.isFinite(count) ? count : 0 };
  });
}

export function httpInfo(resp: GetAttributeMapInfoResponse): AttributeMapInfo | null {
  if (!resp.info) return null;
  return {
    dim: resp.info.dim,
    worldScale: resp.info.world_scale,
    sha256: resp.info.sha256,
    histogram: normalizeHistogram(resp.info.histogram),
    meanings: resp.info.meanings ?? [],
  };
}

export function binaryPayload(resp: TransformAttributeMapResponse): Buffer | null {
  if (!resp.data) return null;
  const data = typeof resp.data === "string" ? Buffer.from(resp.data, "base64") : Buffer.from(resp.data);
  return data.length === ATTRIBUTE_MAP_SIZE ? data : null;
}

export function transformJson(resp: TransformAttributeMapResponse, data: Buffer) {
  return {
    changedCount: resp.changed_count ?? 0,
    beforeHistogram: normalizeHistogram(resp.before_histogram),
    afterHistogram: normalizeHistogram(resp.after_histogram),
    originalSha256: resp.original_sha256 ?? "",
    newSha256: resp.new_sha256 ?? "",
    filename: resp.filename || "AttributeMap_New.dat",
    dataBase64: data.toString("base64"),
  };
}

export function adminResultJson(result: TransformAttributeMapResponse["result"] | GetAttributeMapInfoResponse["result"]) {
  return NextResponse.json({ result }, { status: httpForAdminResult(result) });
}
