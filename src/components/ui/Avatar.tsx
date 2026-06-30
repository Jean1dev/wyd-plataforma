export function Avatar({
  initials,
  size = 36,
  ring = "var(--gold-600)",
}: {
  initials: string;
  size?: number;
  ring?: string;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-pill)",
        background: "var(--grad-iron)",
        border: `2px solid ${ring}`,
        boxShadow: "var(--bevel-raise)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        color: "var(--gold-300)",
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}

export default Avatar;
