export function formatDonate(value: string | number | bigint): string {
  const raw = typeof value === "bigint" ? value.toString() : String(value);
  if (!/^-?\d+$/.test(raw)) return raw;

  const sign = raw.startsWith("-") ? "-" : "";
  const digits = sign ? raw.slice(1) : raw;
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function parseDonateInt(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}
