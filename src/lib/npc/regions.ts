// Named world regions, used only to group the NPC moderation table into tabs.
// Keep this module free of "server-only" so the client table can import it.
//
// The region of an NPC is derived from pos_x/pos_y — it is NOT map_id. map_id is
// a label the moderator sets by hand and is 0 for every seeded NPC (the importer,
// dbserver/cmd/dbserver/main.go, never writes MapID), so it cannot group anything.
//
// PORTAL-LOCAL COPY — keep in sync with w2pp-OpenWYD, same obligation as the
// note atop webserver/internal/mapzones/mapzones.go. Two sources:
//   - Release/TMsrv/run/Regions.txt      → the 52 named rectangles below
//   - tmserver/internal/world/city.go    → the 5 CityLimit rectangles at the end
// The city rectangles matter: they are much tighter than the Regions.txt areas
// covering the same ground, so "smallest rectangle wins" resolves a town centre
// to Armia/Azran/... instead of the surrounding region. On the current content
// tree this labels ~90% of the imported NPCs; the rest fall outside every
// rectangle and the UI buckets them separately.

export type NpcRegion = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Verbatim name from the content file — the bucket key. */
  name: string;
};

// Rectangles are stored normalized (x1 <= x2, y1 <= y2); Regions.txt has one row
// written backwards ("1814, 1815, 1785, 1913 = Reino_Blue") which is normalized
// here. Dugeon_1_Andar_Hidra's y2 runs past the 4096 grid in the source file and
// is transcribed as-is — harmless, nothing spawns up there. Erion and Armia each
// appear twice; both rows are kept and collapse into one bucket by name.
export const NPC_REGIONS: NpcRegion[] = [
  { x1: 129, y1: 137, x2: 253, y2: 243, name: "Guerra_de_Cidades" },
  { x1: 261, y1: 261, x2: 380, y2: 380, name: "Monster_City" },
  { x1: 1031, y1: 1927, x2: 1271, y2: 2171, name: "RvR" },
  { x1: 1285, y1: 268, x2: 1332, y2: 367, name: "Pesadelo_N" },
  { x1: 1026, y1: 260, x2: 1158, y2: 382, name: "Pesadelo_M" },
  { x1: 1155, y1: 130, x2: 1290, y2: 225, name: "Pesadelo_A" },
  { x1: 1137, y1: 1669, x2: 1282, y2: 1786, name: "Deserto_Pilar" },
  { x1: 1282, y1: 1664, x2: 1396, y2: 1785, name: "Deserto_Manticora" },
  { x1: 1283, y1: 1788, x2: 1397, y2: 1910, name: "Deserto_Lugefer" },
  { x1: 1397, y1: 1671, x2: 1521, y2: 1785, name: "Deserto_Baixo" },
  { x1: 1522, y1: 1675, x2: 1669, y2: 1787, name: "Deserto_Reino" },
  { x1: 1669, y1: 1544, x2: 1785, y2: 1639, name: "Reino_Red" },
  { x1: 1670, y1: 1640, x2: 1785, y2: 1813, name: "Zona_Neutra" },
  { x1: 1785, y1: 1815, x2: 1814, y2: 1913, name: "Reino_Blue" },
  { x1: 1788, y1: 1538, x2: 2185, y2: 1785, name: "Azran_Reino" },
  { x1: 2180, y1: 1533, x2: 2435, y2: 1787, name: "Azran_Jardim" },
  { x1: 2187, y1: 1155, x2: 2298, y2: 1297, name: "Castelo_Zakun" },
  { x1: 2179, y1: 1293, x2: 2295, y2: 1534, name: "Azran_Zakun" },
  { x1: 2589, y1: 1671, x2: 2681, y2: 1785, name: "Coliseu" },
  { x1: 2444, y1: 1748, x2: 2552, y2: 1840, name: "Azran_Torre" },
  { x1: 2438, y1: 1914, x2: 2680, y2: 2168, name: "Erion" },
  { x1: 2055, y1: 1927, x2: 2166, y2: 2059, name: "Campo_de_Treino" },
  { x1: 2164, y1: 2054, x2: 2684, y2: 2170, name: "Armia" },
  { x1: 2313, y1: 2170, x2: 2428, y2: 2296, name: "Entrada_Dungeon" },
  { x1: 2435, y1: 1916, x2: 2688, y2: 2070, name: "Erion" },
  { x1: 2171, y1: 2045, x2: 2720, y2: 2322, name: "Armia" },
  { x1: 3391, y1: 2649, x2: 4027, y2: 3255, name: "Karden" },
  { x1: 1029, y1: 3465, x2: 1141, y2: 3569, name: "Agua_N" },
  { x1: 1161, y1: 3595, x2: 1267, y2: 3695, name: "Agua_M" },
  { x1: 1289, y1: 3467, x2: 1397, y2: 3569, name: "Agua_A" },
  { x1: 1651, y1: 3577, x2: 1927, y2: 3723, name: "Portao_Infernal" },
  { x1: 2173, y1: 3583, x2: 2307, y2: 3711, name: "Vale_Escondido" },
  { x1: 127, y1: 3710, x2: 767, y2: 6841, name: "Dugeon_1_Andar_Hidra" },
  { x1: 381, y1: 3841, x2: 511, y2: 4086, name: "Dungeon_1_Andar_Kaizen" },
  { x1: 632, y1: 3847, x2: 1022, y2: 4091, name: "Dungeon_2_Andar" },
  { x1: 898, y1: 3712, x2: 1143, y2: 3830, name: "Dungeon_3_Andar" },
  { x1: 1283, y1: 3714, x2: 1538, y2: 3838, name: "Submundo_1" },
  { x1: 1153, y1: 3966, x2: 1533, y2: 4089, name: "Submundo_2" },
  { x1: 1656, y1: 3968, x2: 1797, y2: 4092, name: "Cubo_N" },
  { x1: 1794, y1: 3845, x2: 1910, y2: 3963, name: "Cubo_M" },
  { x1: 1924, y1: 3973, x2: 2045, y2: 4091, name: "Cubo_A" },
  { x1: 2179, y1: 3850, x2: 2303, y2: 4091, name: "Kefra_Esquerda" },
  { x1: 2304, y1: 3850, x2: 2435, y2: 4091, name: "Kefra_Meio" },
  { x1: 2436, y1: 3850, x2: 2551, y2: 4093, name: "Kefra_Direita" },
  { x1: 3581, y1: 3583, x2: 3705, y2: 3705, name: "Lan_N" },
  { x1: 3717, y1: 3463, x2: 3833, y2: 3577, name: "Lan_M" },
  { x1: 3851, y1: 3595, x2: 3977, y2: 3707, name: "Lan_A" },
  { x1: 3973, y1: 3973, x2: 4096, y2: 4096, name: "Cassino" },
  { x1: 3330, y1: 1025, x2: 3602, y2: 1659, name: "Pistas" },
  { x1: 3199, y1: 1667, x2: 3321, y2: 1785, name: "Kefra_City" },
  { x1: 1272, y1: 1427, x2: 1403, y2: 1532, name: "Big_Cubo" },
  { x1: 895, y1: 1409, x2: 1146, y2: 1534, name: "Nova_Guerra_Noatun" },
  // The 5 CityLimit rectangles (world/city.go), named after mapzones.All.
  { x1: 2052, y1: 2052, x2: 2171, y2: 2163, name: "Armia" },
  { x1: 2432, y1: 1672, x2: 2675, y2: 1767, name: "Azran" },
  { x1: 2448, y1: 1966, x2: 2476, y2: 2024, name: "Erion" },
  { x1: 3605, y1: 3090, x2: 3690, y2: 3260, name: "Nippleheim" },
  { x1: 1036, y1: 1700, x2: 1072, y2: 1760, name: "Noatum" },
];

// The 5 canonical cities, in mapzones.All order. The UI pins these to the front
// of the tab rail; every other region follows.
export const CITY_REGION_NAMES = ["Armia", "Azran", "Erion", "Nippleheim", "Noatum"] as const;

// Rectangles overlap heavily, so the match has to be the most specific one.
// Areas are precomputed here rather than inside regionFor, which runs once per
// NPC on every render of the table.
const RANKED_REGIONS = NPC_REGIONS.map((r) => ({
  region: r,
  area: (r.x2 - r.x1 + 1) * (r.y2 - r.y1 + 1),
})).sort((a, b) => a.area - b.area);

/**
 * Name of the smallest region rectangle containing (x, y), or null when the
 * position falls outside every one of them (a real case — roughly 10% of the
 * seeded NPCs stand on unnamed ground).
 */
export function regionFor(x: number, y: number): string | null {
  for (const { region } of RANKED_REGIONS) {
    if (x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2) {
      return region.name;
    }
  }
  return null;
}

/** Content-file names are snake_case; show them with spaces. */
export function regionLabel(name: string): string {
  return name.replace(/_/g, " ");
}
