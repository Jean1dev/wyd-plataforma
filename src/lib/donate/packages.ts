// Static credit packages (BRL -> donate credits). Kept in code for the MVP;
// `amountCents` is what we charge via the payment gateway, `credits` is what the
// web-api grants once the payment is confirmed.
export type TopupPackage = {
  id: string;
  label: string;
  amountCents: number;
  credits: number;
};

export const TOPUP_PACKAGES: readonly TopupPackage[] = [
  { id: "p10", label: "Recarga Bronze", amountCents: 1000, credits: 10 },
  { id: "p25", label: "Recarga Prata", amountCents: 2500, credits: 30 },
  { id: "p50", label: "Recarga Ouro", amountCents: 5000, credits: 70 },
];

export function getTopupPackage(id: string): TopupPackage | undefined {
  return TOPUP_PACKAGES.find((p) => p.id === id);
}

// Extra donates over the base 1-donate-per-real rate (0 when there's no bonus).
export function packageBonus(p: TopupPackage): number {
  return Math.max(0, p.credits - Math.floor(p.amountCents / 100));
}

// "500" cents -> "R$ 5,00"
export function formatBRL(amountCents: number): string {
  return `R$ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
}
