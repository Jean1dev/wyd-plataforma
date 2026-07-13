export type AdminResult =
  | "ADMIN_RESULT_UNSPECIFIED"
  | "ADMIN_RESULT_OK"
  | "ADMIN_RESULT_FORBIDDEN"
  | "ADMIN_RESULT_INVALID"
  | "ADMIN_RESULT_NOT_FOUND";

export type BuyResult =
  | "BUY_RESULT_UNSPECIFIED"
  | "BUY_RESULT_OK"
  | "BUY_RESULT_INSUFFICIENT_FUNDS"
  | "BUY_RESULT_NOT_FOUND"
  | "BUY_RESULT_DISABLED";

export type DonateShopItem = {
  id: string;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
  price: number;
  title: string;
  description: string;
  enabled: boolean;
  expires_days: number;
};

export type DonateShopItemPayload = Omit<DonateShopItem, "id"> & { id?: string };

export type ShopLoadState =
  | { status: "ok"; items: DonateShopItem[]; balance: string }
  | { status: "unavailable"; items: []; balance: "0" };

export type AdminDonateLoadState =
  | { status: "ok"; items: DonateShopItem[] }
  | { status: "forbidden" | "unavailable"; items: [] };

// ---- Donate top-up (recarga via gateway de pagamento) ----

export type PaymentMethod =
  | "PAYMENT_METHOD_UNSPECIFIED"
  | "PAYMENT_METHOD_PIX"
  | "PAYMENT_METHOD_CREDIT_CARD";

export type TopupResult =
  | "TOPUP_RESULT_UNSPECIFIED"
  | "TOPUP_RESULT_CONFIRMED"
  | "TOPUP_RESULT_ALREADY_CONFIRMED"
  | "TOPUP_RESULT_NOT_FOUND";

export type TopupStatus = "TOPUP_STATUS_UNSPECIFIED" | "TOPUP_STATUS_PENDING" | "TOPUP_STATUS_PAID";

export type PayerProfile = { name: string; cpf: string };
