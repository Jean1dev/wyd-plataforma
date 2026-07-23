export type WorldEventConfigJson = {
  enabled: boolean;
  itemIndex: number;
  rate: number;
  startIndex: number;
  currentIndex: number;
  endIndex: number;
  indexed: boolean;
  noticeEnabled: boolean;
  doubleExpEnabled: boolean;
  newbieEventEnabled: boolean;
};

export type WorldEventConfigProto = {
  enabled: boolean;
  item_index: number;
  rate: number;
  start_index: number;
  current_index: number;
  end_index: number;
  indexed: boolean;
  notice_enabled: boolean;
  double_exp_enabled: boolean;
  newbie_event_enabled: boolean;
};

export type WorldEventStatus = "disabled" | "active" | "exhausted";

export type WorldEventGetJson = {
  version: string;
  config: WorldEventConfigJson;
};

export type WorldEventPutJson = {
  version: string;
  config: WorldEventConfigJson;
};

