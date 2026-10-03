/**
 * Art slots for the portal skin. Every slot has a CSS/SVG fallback, so a
 * slot left as `null` only makes the screen plainer — never broken.
 *
 * To plug in AI-generated art (see public/assets/README.md for sizes and
 * prompts): drop the file in public/assets/ and point the slot at it.
 */
export const PORTAL_ASSETS = {
  /** Full-bleed key art: left half of the login screen, dashboard and download heroes. Falls back to an SVG night scene. */
  heroKeyart: null as string | null,
  /** Transparent winged crest above the login frame and modals. Falls back to the inline SVG crest. */
  crest: null as string | null,
  /** Tileable dark texture behind .wyd-frame / .wyd-panel. Falls back to a flat gradient. */
  panelTexture: null as string | null,
};
