// Strips everything but digits. Returns "" if the result isn't exactly 11
// digits (structural check only — no checksum validation).
export function normalizeCpf(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length === 11 ? digits : "";
}
