import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "gold" | "premium";

const VARIANTS: Record<BadgeVariant, CSSProperties> = {
  gold: {
    background: "rgba(200,163,91,0.14)",
    color: "var(--gold-300)",
    border: "1px solid var(--gold-700)",
  },
  premium: {
    background: "rgba(125,90,166,0.18)",
    color: "var(--amethyst-400)",
    border: "1px solid var(--amethyst-600)",
  },
};

export function Badge({
  variant = "gold",
  children,
  style,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-2xs)",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
