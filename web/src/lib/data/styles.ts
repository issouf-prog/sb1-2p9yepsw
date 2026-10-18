import type { Style } from "./types";

// Catalogue de styles (noms et descriptions écrits pour ce projet).
const preset = (id: string, name: string, promptSuffix: string): Style => ({
  id: `catalog:${id}`, name, promptSuffix, workspaceId: null, referenceUrls: [], createdAt: "2026-01-01T00:00:00.000Z",
});

export const STYLE_CATALOG: Style[] = [
  preset("pellicule", "Pellicule 35 mm", "tourné sur pellicule 35 mm, grain fin, couleurs chaudes, légère halation"),
  preset("noir", "Film noir", "noir et blanc contrasté, ombres dures, fumée, éclairage latéral"),
  preset("anim3d", "Animation 3D douce", "animation 3D stylisée, matières douces, lumière enveloppante, couleurs vives"),
  preset("aquarelle", "Aquarelle", "aquarelle sur papier texturé, bords fondus, palette pastel"),
  preset("cel", "Dessin animé cel", "animation 2D traditionnelle, aplats, contours nets"),
  preset("neon", "Nuit néon", "nuit urbaine, reflets mouillés, néons cyan et magenta"),
  preset("documentaire", "Documentaire", "caméra à l'épaule, lumière naturelle, rendu réaliste"),
  preset("stopmotion", "Stop motion", "pâte à modeler, petites imperfections, miniatures faites main"),
  preset("huile", "Peinture à l'huile", "peinture à l'huile, touches visibles, clair-obscur"),
  preset("bd", "Bande dessinée", "bande dessinée franco-belge, ligne claire, couleurs franches"),
  preset("gravure", "Gravure", "gravure sur bois, hachures, deux couleurs"),
  preset("pastel", "Pastel rêveur", "lumière pastel, brume légère, faible contraste"),
];

export function applyStyle(prompt: string, style: Style | null | undefined) {
  return style ? `${prompt}, ${style.promptSuffix}` : prompt;
}
