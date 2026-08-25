import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeShopQuantity,
  parseInt64Decimal,
  parseNpcShopItems,
  parsePositiveInt32,
  parseUint8,
} from "./validation";

const baseShopItem = {
  slot: 0,
  item_index: 1,
  eff1: 10,
  effv1: 11,
  eff2: 20,
  effv2: 21,
  eff3: 30,
  effv3: 31,
  quantity: 1,
};

test("uint8 effects accept their exact boundaries without coercion", () => {
  assert.equal(parseUint8(0), 0);
  assert.equal(parseUint8("255"), 255);
  assert.equal(parseUint8(-1), null);
  assert.equal(parseUint8(256), null);
  assert.equal(parseUint8("1.5"), null);
});

test("EF_AMOUNT is rejected only in effect identifier fields", () => {
  for (const field of ["eff1", "eff2", "eff3"] as const) {
    const parsed = parseNpcShopItems([{ ...baseShopItem, [field]: 61 }], 27);
    assert.deepEqual(parsed, { ok: false, error: "effect_amount_derived" });
  }

  for (const field of ["effv1", "effv2", "effv3"] as const) {
    const parsed = parseNpcShopItems([{ ...baseShopItem, [field]: 61 }], 27);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.items[0][field], 61);
  }
});

test("shop parsing preserves all existing effects on an unchanged save", () => {
  const parsed = parseNpcShopItems([baseShopItem], 27);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.deepEqual(parsed.items, [baseShopItem]);
});

test("positive int32 item indexes enforce protobuf boundaries", () => {
  assert.equal(parsePositiveInt32(1), 1);
  assert.equal(parsePositiveInt32("2147483647"), 2147483647);
  for (const invalid of [0, -1, 2147483648, 1.5, "not-an-index", Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(parsePositiveInt32(invalid), null, String(invalid));
  }
});

test("shop parsing blocks invalid item indexes before an RPC payload exists", () => {
  for (const invalid of [0, -1, 2147483648, 1.5, "invalid", Number.MAX_SAFE_INTEGER + 1]) {
    const parsed = parseNpcShopItems([{ ...baseShopItem, item_index: invalid }], 27);
    assert.deepEqual(parsed, { ok: false, error: "item_index_invalid" });
  }
});

test("quantity keeps the legacy normalization and uint8 range", () => {
  assert.equal(normalizeShopQuantity(undefined), 1);
  assert.equal(normalizeShopQuantity(""), 1);
  assert.equal(normalizeShopQuantity(0), 1);
  assert.equal(normalizeShopQuantity(1), 1);
  assert.equal(normalizeShopQuantity(255), 255);
  assert.equal(normalizeShopQuantity(-1), null);
  assert.equal(normalizeShopQuantity(256), null);
});

test("int64 prices remain canonical decimal strings", () => {
  assert.equal(parseInt64Decimal("0"), "0");
  assert.equal(parseInt64Decimal("-1"), "-1");
  assert.equal(parseInt64Decimal("9223372036854775807"), "9223372036854775807");
  assert.equal(parseInt64Decimal("-9223372036854775808"), "-9223372036854775808");
  assert.equal(parseInt64Decimal("9223372036854775808"), null);
  assert.equal(parseInt64Decimal(Number.MAX_SAFE_INTEGER + 1), null);
});
