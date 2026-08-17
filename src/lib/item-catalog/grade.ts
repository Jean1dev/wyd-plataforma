// Item rarity (ItemList.csv column 8). Drives the fallback icon's tint and the
// frame drawn around it — decoration lives in CSS, never baked into the image
// (docs/item-icons.md §"decoração fica no front").

export type GradeMeta = { label: string; color: string };

// The catalog only guarantees 1..4 today; anything else (including 0, "no
// grade") falls through to UNKNOWN_GRADE rather than breaking the render.
export const GRADE_META: Record<number, GradeMeta> = {
  1: { label: "Normal", color: "var(--iron-200)" },
  2: { label: "Místico", color: "var(--steel-400)" },
  3: { label: "Arcano", color: "var(--amethyst-400)" },
  4: { label: "Lendário", color: "var(--gold-400)" },
};

export const UNKNOWN_GRADE: GradeMeta = { label: "", color: "var(--iron-200)" };

export function gradeMeta(grade: number | undefined): GradeMeta {
  return (grade != null && GRADE_META[grade]) || UNKNOWN_GRADE;
}
