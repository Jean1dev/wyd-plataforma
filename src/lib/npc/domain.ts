// Domain semantics for NPC editing, mirrored on the client for UX. The web-api
// remains the authority on validation — never trust these for security.

export type MerchantType = {
  value: number;
  label: string;
  /** Whether a shop (SetNpcShop) is meaningful for this merchant type. */
  hasShop: boolean;
};

// Accepted merchant values; anything else -> ADMIN_RESULT_INVALID.
export const MERCHANT_TYPES: MerchantType[] = [
  { value: 0, label: "Não-merchant (sem loja)", hasShop: false },
  { value: 1, label: "Loja normal", hasShop: true },
  { value: 2, label: "Guarda-carga (armazém)", hasShop: false },
  { value: 19, label: "Loja tipo 3", hasShop: true },
  { value: 100, label: "NPC de quest", hasShop: false },
];

export const MERCHANT_VALUES = new Set(MERCHANT_TYPES.map((m) => m.value));

export function merchantHasShop(merchant: number): boolean {
  return MERCHANT_TYPES.find((m) => m.value === merchant)?.hasShop ?? false;
}

// The shop has 27 display slots (0..26) organized as 3 tabs of 9.
export const SHOP_SLOT_COUNT = 27;
export const SHOP_TAB_SIZE = 9;
export const SHOP_TABS = [
  { index: 0, label: "Aba 1", from: 0, to: 8 },
  { index: 1, label: "Aba 2", from: 9, to: 17 },
  { index: 2, label: "Aba 3", from: 18, to: 26 },
] as const;

export function slotTab(slot: number): number {
  return Math.floor(slot / SHOP_TAB_SIZE);
}
