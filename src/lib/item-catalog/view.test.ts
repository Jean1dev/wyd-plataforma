import assert from "node:assert/strict";
import test from "node:test";
import { itemIconUrl, toItemIconData } from "./view";

const entry = {
  item_index: 42,
  name: "Item_Cru",
  icon_key: "https://attacker.invalid/derived.png",
  display_name: "Item Cru",
  slot_mask: 0,
  slots: [],
  grade: 1,
  mesh: 0,
  texture: 0,
  icon_url: "https://cdn.example.test/approved.png",
};

test("catalog projection propagates the approved icon URL", () => {
  const item = toItemIconData(entry);
  assert.equal(item.iconUrl, entry.icon_url);
  assert.equal(item.iconKey, entry.icon_key);
  assert.equal(itemIconUrl(item, "pack-v1"), entry.icon_url);
});

test("icon fallback remains active when URL or icon pack version is missing", () => {
  const item = toItemIconData(entry);
  assert.equal(itemIconUrl(item, ""), null);
  assert.equal(itemIconUrl({ ...item, iconUrl: "" }, "pack-v1"), null);
});

test("icon URLs are never derived from icon_key", () => {
  const item = toItemIconData({ ...entry, icon_url: "" });
  assert.equal(itemIconUrl(item, "pack-v1"), null);
  assert.notEqual(item.iconUrl, item.iconKey);
});
