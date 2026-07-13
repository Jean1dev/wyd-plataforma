export type ClaimResult =
  | "CLAIM_RESULT_UNSPECIFIED"
  | "CLAIM_RESULT_OK"
  | "CLAIM_RESULT_ALREADY_CLAIMED"
  | "CLAIM_RESULT_NOT_FOUND"
  | "CLAIM_RESULT_DISABLED";

export type DailyRewardItem = {
  id: string;
  item_index: number;
  eff1: number;
  effv1: number;
  eff2: number;
  effv2: number;
  eff3: number;
  effv3: number;
  title: string;
  description: string;
  enabled: boolean;
  expires_days: number;
};

export type DailyRewardItemPayload = Omit<DailyRewardItem, "id"> & { id?: string };

export type RewardLoadState =
  | {
      status: "ok";
      items: DailyRewardItem[];
      claimedToday: boolean;
      claimedItemId: string;
      claimedItemTitle: string;
    }
  | { status: "unavailable" };

export type AdminRewardLoadState =
  | { status: "ok"; items: DailyRewardItem[] }
  | { status: "forbidden" | "unavailable"; items: [] };
