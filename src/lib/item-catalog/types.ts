// Browser-safe view types for item icons. Deliberately free of "server-only":
// server pages build these maps and pass them straight into client components.

/**
 * The slice of an ItemCatalogEntry an icon needs. `iconKey` addresses the image
 * pack; `slots`/`grade` drive the fallback, which is the guaranteed path (see
 * docs/item-icons.md).
 */
export type ItemIconData = {
  itemIndex: number;
  displayName: string;
  iconKey: string;
  slots: string[];
  grade: number;
};

/**
 * item_index → icon data, reduced to the items one screen actually shows. The
 * full catalog is ~3.2k entries (~400 KB); never ship it whole to the browser
 * from a server page — project it with pickItemIcons() first.
 */
export type ItemIconMap = Record<number, ItemIconData>;
