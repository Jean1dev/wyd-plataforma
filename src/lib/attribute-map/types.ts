import type { AdminResult } from "@/lib/npc/types";

export type { AdminResult };

export const ATTRIBUTE_MAP_DIM = 1024;
export const ATTRIBUTE_MAP_WORLD_SCALE = 4;
export const ATTRIBUTE_MAP_WORLD_MAX = ATTRIBUTE_MAP_DIM * ATTRIBUTE_MAP_WORLD_SCALE - 1;
export const ATTRIBUTE_MAP_SIZE = ATTRIBUTE_MAP_DIM * ATTRIBUTE_MAP_DIM;

export type AttributeMapValueCount = {
  value: number;
  count: number;
};

export type AttributeMapMeaning = {
  value: number;
  name: string;
  description: string;
  bit: boolean;
};

export type AttributeMapInfo = {
  dim: number;
  worldScale: number;
  sha256: string;
  histogram: AttributeMapValueCount[];
  meanings: AttributeMapMeaning[];
};

export type AttributeMapTransformOperation =
  | "ATTRIBUTE_MAP_TRANSFORM_OPERATION_LEGACY_MARK_PVP_EXP_LOSS"
  | "ATTRIBUTE_MAP_TRANSFORM_OPERATION_ASSIGN_VALUE"
  | "ATTRIBUTE_MAP_TRANSFORM_OPERATION_SET_BITS"
  | "ATTRIBUTE_MAP_TRANSFORM_OPERATION_CLEAR_BITS"
  | "ATTRIBUTE_MAP_TRANSFORM_OPERATION_TOGGLE_BITS";

export type AttributeMapRect = {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
};

export type AttributeMapTransformFilter = {
  enabled: boolean;
  exact_value: number;
  mask: number;
  match_value: number;
};

export type AttributeMapTransformInput = {
  operation: AttributeMapTransformOperation;
  operand: number;
  rect?: AttributeMapRect;
  filter?: AttributeMapTransformFilter;
};

export type AttributeMapTransformResult = {
  changedCount: number;
  beforeHistogram: AttributeMapValueCount[];
  afterHistogram: AttributeMapValueCount[];
  originalSha256: string;
  newSha256: string;
  filename: string;
  dataBase64: string;
};
