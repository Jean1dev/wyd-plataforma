import { MERCHANT_VALUES } from "@/lib/npc/domain";

export type UpsertFields = {
  slug: string;
  template_name: string;
  display_name: string;
  enabled: boolean;
  map_id: number;
  pos_x: number;
  pos_y: number;
  route_type: number;
  merchant: number;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function int(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
}

// Mirrors the web-api's validation for UX; the web-api stays the authority.
export function parseUpsertBody(body: unknown): ParseResult<UpsertFields> {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;

  const slug = str(b.slug);
  const template_name = str(b.template_name);
  const display_name = str(b.display_name);
  if (!slug) return { ok: false, error: "slug_required" };
  if (!template_name) return { ok: false, error: "template_name_required" };

  const map_id = int(b.map_id);
  const pos_x = int(b.pos_x);
  const pos_y = int(b.pos_y);
  const route_type = int(b.route_type ?? 0);
  const merchant = int(b.merchant ?? 0);

  if (map_id == null || pos_x == null || pos_y == null) {
    return { ok: false, error: "position_required" };
  }
  if (route_type == null) return { ok: false, error: "route_type_invalid" };
  if (merchant == null || !MERCHANT_VALUES.has(merchant)) {
    return { ok: false, error: "merchant_invalid" };
  }

  return {
    ok: true,
    value: {
      slug,
      template_name,
      display_name,
      enabled: Boolean(b.enabled),
      map_id,
      pos_x,
      pos_y,
      route_type,
      merchant,
    },
  };
}
