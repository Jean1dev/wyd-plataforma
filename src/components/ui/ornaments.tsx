import { useId } from "react";
import { PORTAL_ASSETS } from "@/lib/portal-assets";

/**
 * Winged crest that sits on top of a `.wyd-frame--crest`. Renders the
 * configured AI art when present, otherwise an inline SVG emblem.
 */
export function Crest() {
  const uid = useId().replace(/:/g, "");
  const metal = `crest-metal-${uid}`;
  const gold = `crest-gold-${uid}`;

  if (PORTAL_ASSETS.crest) {
    // eslint-disable-next-line @next/next/no-img-element -- decorative art slot, size varies with the supplied file
    return <img className="wyd-crest" src={PORTAL_ASSETS.crest} alt="" aria-hidden="true" />;
  }

  return (
    <svg className="wyd-crest" viewBox="0 0 240 96" aria-hidden="true">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3ccda" />
          <stop offset="0.35" stopColor="#5d6b82" />
          <stop offset="0.6" stopColor="#1f293a" />
          <stop offset="1" stopColor="#4b576b" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.5" stopColor="#d9b77b" />
          <stop offset="1" stopColor="#8a6829" />
        </linearGradient>
      </defs>
      {/* Wings: one path, mirrored. */}
      {[false, true].map((mirror) => (
        <g key={String(mirror)} transform={mirror ? "matrix(-1 0 0 1 240 0)" : undefined}>
          <path
            d="M104 52 C84 30 56 18 8 22 C30 28 40 34 46 40 C30 38 18 42 10 50 C30 48 44 50 52 56 C40 58 30 64 24 74 C46 66 70 66 92 72 Z"
            fill={`url(#${metal})`}
            stroke="#05080d"
            strokeWidth="1.5"
          />
          <path d="M100 54 C82 38 60 28 26 26" fill="none" stroke="#c8a35b" strokeOpacity="0.55" strokeWidth="1" />
          <path d="M96 62 C78 52 60 48 30 50" fill="none" stroke="#c8a35b" strokeOpacity="0.35" strokeWidth="1" />
        </g>
      ))}
      {/* Shield */}
      <path
        d="M120 14 L148 24 C148 54 140 72 120 88 C100 72 92 54 92 24 Z"
        fill={`url(#${metal})`}
        stroke="#05080d"
        strokeWidth="2"
      />
      <path
        d="M120 21 L141 28.5 C141 53 134 67 120 80 C106 67 99 53 99 28.5 Z"
        fill="#0a1019"
        stroke={`url(#${gold})`}
        strokeWidth="1.6"
      />
      {/* Gem */}
      <path d="M120 34 L131 48 L120 66 L109 48 Z" fill={`url(#${gold})`} stroke="#3a2414" strokeWidth="1" />
      <path d="M120 34 L124 48 L120 66" fill="none" stroke="#fff3d6" strokeOpacity="0.6" strokeWidth="0.8" />
    </svg>
  );
}

export default Crest;
