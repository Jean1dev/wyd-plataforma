import type { CSSProperties, ReactNode } from "react";

type TagColor = "gold" | "steel" | "iron";

const COLORS: Record<TagColor, CSSProperties> = {
  gold: { color: "var(--gold-300)", borderColor: "var(--gold-700)" },
  steel: { color: "var(--steel-300)", borderColor: "var(--steel-600)" },
  iron: { color: "var(--text-muted)", borderColor: "var(--iron-400)" },
};

export function Tag({
  color = "iron",
  children,
}: {
  color?: TagColor;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 11px",
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-inset)",
        border: "1px solid",
        boxShadow: "var(--bevel-in)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-2xs)",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        ...COLORS[color],
      }}
    >
      {children}
    </span>
  );
}

export default Tag;
