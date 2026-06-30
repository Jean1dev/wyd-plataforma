import { Sword, Sparkles, PawPrint, Target, type LucideIcon } from "lucide-react";

export type WydClass = "TK" | "FM" | "BM" | "HT";

type ClassMeta = { color: string; glow: string; Icon: LucideIcon; label: string };

export const CLASS_META: Record<WydClass, ClassMeta> = {
  TK: { color: "var(--class-transknight)", glow: "var(--glow-steel)", Icon: Sword, label: "Transknight" },
  FM: { color: "var(--class-foema)", glow: "0 0 0 1px var(--amethyst-600), 0 0 14px rgba(125,90,166,0.5)", Icon: Sparkles, label: "Foema" },
  BM: { color: "var(--class-beastmaster)", glow: "0 0 0 1px var(--emerald-600), 0 0 14px rgba(62,140,90,0.5)", Icon: PawPrint, label: "BeastMaster" },
  HT: { color: "var(--class-huntress)", glow: "var(--glow-blood)", Icon: Target, label: "Huntress" },
};

const SIZES = { sm: 32, md: 44, lg: 56 } as const;

export function ClassCrest({
  cls,
  size = "md",
}: {
  cls: WydClass;
  size?: keyof typeof SIZES;
}) {
  const meta = CLASS_META[cls];
  const px = SIZES[size];
  const Icon = meta.Icon;

  return (
    <span
      title={meta.label}
      style={{
        width: px,
        height: px,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-inset)",
        border: `1px solid ${meta.color}`,
        boxShadow: meta.glow,
        color: meta.color,
      }}
    >
      <Icon size={Math.round(px * 0.5)} strokeWidth={1.75} />
    </span>
  );
}

export default ClassCrest;
