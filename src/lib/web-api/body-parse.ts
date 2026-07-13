export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function int(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export function bool(value: unknown): boolean {
  return value === true;
}
