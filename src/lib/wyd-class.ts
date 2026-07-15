export type WydClass = "TK" | "FM" | "BM" | "HT";

type ClassMeta = { label: string; image: string };

export const CLASS_META: Record<WydClass, ClassMeta> = {
  TK: {
    label: "Transknight",
    image: "https://imagedelivery.net/kn1S83YLYaEJFOrZvTLCrw/44801990-1f02-48a7-4996-543097583000/Thumbnail",
  },
  FM: {
    label: "Foema",
    image: "https://imagedelivery.net/kn1S83YLYaEJFOrZvTLCrw/72df3110-07ea-4050-b863-f4819ae5f800/Thumbnail",
  },
  BM: {
    label: "BeastMaster",
    image: "https://imagedelivery.net/kn1S83YLYaEJFOrZvTLCrw/60758807-bd86-4ca0-2403-fb3facefae00/Thumbnail",
  },
  HT: {
    label: "Huntress",
    image: "https://imagedelivery.net/kn1S83YLYaEJFOrZvTLCrw/29fec7a3-1427-4802-590c-12fc16989b00/Thumbnail",
  },
};

const CLASS_BY_CODE: Record<number, WydClass> = { 0: "TK", 1: "FM", 2: "BM", 3: "HT" };

export function wydClassFromCode(code: number): WydClass | undefined {
  return CLASS_BY_CODE[code];
}
