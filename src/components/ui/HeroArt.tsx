import Image from "next/image";
import { useId } from "react";
import { PORTAL_ASSETS } from "@/lib/portal-assets";

/**
 * Full-bleed background art for heroes. Fills its positioned parent.
 * Uses the configured key art when present, otherwise draws a moonlit
 * castle scene in SVG so the layout never depends on a raster file.
 */
export function HeroArt({ sizes, className }: { sizes: string; className?: string }) {
  if (PORTAL_ASSETS.heroKeyart) {
    return <Image src={PORTAL_ASSETS.heroKeyart} alt="" fill priority sizes={sizes} className={className} />;
  }
  return <HeroScene className={className} />;
}

function HeroScene({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const sky = `sky-${uid}`;
  const moon = `moon-${uid}`;
  const fog = `fog-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060a12" />
          <stop offset="0.45" stopColor="#14213a" />
          <stop offset="0.72" stopColor="#2b3550" />
          <stop offset="0.9" stopColor="#4a3a3c" />
        </linearGradient>
        <radialGradient id={moon} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f3ead2" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#c9d6ea" stopOpacity="0.18" />
          <stop offset="1" stopColor="#c9d6ea" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={fog} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa3c0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8fa3c0" stopOpacity="0.16" />
          <stop offset="1" stopColor="#8fa3c0" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1600" height="1000" fill={`url(#${sky})`} />

      {/* Stars */}
      <g fill="#dfe7f5">
        {[
          [120, 90, 1.4], [260, 170, 1], [410, 60, 1.2], [560, 140, 0.9], [700, 40, 1.3], [860, 120, 1],
          [980, 70, 1.5], [1320, 110, 1.1], [1460, 50, 1.3], [1540, 190, 0.9], [340, 260, 0.8], [640, 230, 1],
          [1400, 280, 0.9], [60, 300, 1], [1250, 30, 0.9], [820, 280, 0.8],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={0.35 + (r - 0.8) * 0.6} />
        ))}
      </g>

      {/* Moon */}
      <circle cx="1010" cy="200" r="260" fill={`url(#${moon})`} />
      <circle cx="1010" cy="200" r="54" fill="#efe6cf" opacity="0.92" />
      <circle cx="992" cy="186" r="10" fill="#d6ccb3" opacity="0.6" />
      <circle cx="1028" cy="218" r="7" fill="#d6ccb3" opacity="0.5" />

      {/* Far range */}
      <path
        d="M0 640 L120 560 L210 600 L330 480 L430 560 L520 500 L640 590 L760 470 L880 560 L1010 430 L1120 540 L1260 460 L1380 560 L1500 500 L1600 560 L1600 1000 L0 1000Z"
        fill="#1a2539"
      />
      <rect y="520" width="1600" height="180" fill={`url(#${fog})`} />

      {/* Castle on the middle peak */}
      <g fill="#0d1523">
        <path d="M560 760 L700 560 L760 520 L860 520 L920 560 L1060 760Z" />
        <rect x="690" y="430" width="44" height="140" />
        <path d="M684 432 L712 360 L740 432Z" />
        <rect x="760" y="380" width="56" height="170" />
        <path d="M752 382 L788 280 L824 382Z" />
        <rect x="840" y="440" width="40" height="120" />
        <path d="M834 442 L860 380 L886 442Z" />
        <rect x="730" y="470" width="130" height="80" />
        <path d="M640 600 L660 520 L680 600Z" />
        <rect x="900" y="480" width="30" height="90" />
        <path d="M894 482 L915 430 L936 482Z" />
        <rect x="785" y="268" width="6" height="20" />
      </g>
      <path d="M788 268 L788 250 L812 256 L788 262Z" fill="#7a1e22" />
      <g fill="#f0b45a">
        <rect x="706" y="470" width="6" height="10" opacity="0.9" />
        <rect x="780" y="420" width="6" height="11" opacity="0.85" />
        <rect x="796" y="460" width="5" height="9" opacity="0.7" />
        <rect x="855" y="480" width="5" height="9" opacity="0.8" />
        <rect x="750" y="500" width="5" height="8" opacity="0.6" />
        <rect x="910" y="510" width="5" height="8" opacity="0.7" />
      </g>

      {/* Near range + fog */}
      <path
        d="M0 760 L140 690 L260 740 L400 650 L520 730 L640 700 L760 780 L900 720 L1040 790 L1180 690 L1320 760 L1460 700 L1600 750 L1600 1000 L0 1000Z"
        fill="#0b121e"
      />
      <rect y="700" width="1600" height="160" fill={`url(#${fog})`} />

      {/* Foreground cliff with a lone knight */}
      <path d="M0 880 L180 840 L320 860 L420 820 L520 850 L600 1000 L0 1000Z" fill="#05080d" />
      <g fill="#05080d">
        <rect x="300" y="772" width="18" height="52" rx="4" />
        <circle cx="309" cy="764" r="9" />
        <path d="M296 782 L284 830 L294 830 L302 790Z" />
        <rect x="322" y="740" width="3" height="90" />
        <path d="M268 700 L270 840 L274 840 L272 700Z" />
        <path d="M273 702 L300 708 L298 750 L273 744Z" fill="#5a1418" />
      </g>
    </svg>
  );
}

export default HeroArt;
