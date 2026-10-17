import type { AspectRatio } from "./data/types";

const RATIO: Record<AspectRatio, number> = { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1, "21:9": 21 / 9, "4:3": 4 / 3, "3:4": 3 / 4, "5:4": 5 / 4 };

/** Taille d'affichage d'un média sur la toile selon le format du projet. */
export function mediaSize(ratio: AspectRatio) {
  const r = RATIO[ratio];
  const w = r < 1 ? 220 : r === 1 ? 260 : 320;
  return { w, h: Math.round(w / r) };
}

export const GAP = 40;
export const SECTION_HEADER = 64;
/** Hauteur de la légende sous un média (dimensions + prompt). */
export const CAPTION = 120;

/** Position du n-ième nœud dans une section, et taille de section pour n nœuds. */
export function slot(ratio: AspectRatio, i: number) {
  const { w } = mediaSize(ratio);
  return { x: GAP + i * (w + GAP), y: SECTION_HEADER };
}

export function sectionSize(ratio: AspectRatio, count: number) {
  const { w, h } = mediaSize(ratio);
  return { w: GAP + count * (w + GAP), h: SECTION_HEADER + h + CAPTION + GAP };
}
