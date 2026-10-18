// Modèle du document Histoire et génération de son contenu (format JSON TipTap).
// Textes écrits pour ce projet.

type N = Record<string, unknown>;
const p = (text: string, italic = false): N => ({
  type: "paragraph",
  content: text ? [{ type: "text", text, ...(italic ? { marks: [{ type: "italic" }] } : {}) }] : [],
});
const h = (text: string): N => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
const script = (text: string): N => ({ type: "codeBlock", attrs: { language: "scenario" }, content: [{ type: "text", text }] });

export const STORY_SECTIONS = ["Brief", "Narration", "Direction créative", "Scénario"] as const;

export function storyTemplate(): N {
  return {
    type: "doc",
    content: [
      p("Modèle d'exemple : écrasez-le avec votre film, ou demandez à l'agent de le remplir.", true),
      h("Brief"),
      p("De quoi parle le film, pour qui, en combien de temps."),
      h("Narration"),
      p("Les moments clés, dans l'ordre où le spectateur les vit."),
      h("Direction créative"),
      p("Lumière, palette, rythme, musique, films de référence."),
      h("Scénario"),
      script(
        "EXT. MARCHÉ COUVERT - AUBE\n\nLes rideaux de fer se lèvent un à un. NADIA (30 ans, tablier bleu) pousse un chariot de citrons.\n\nNADIA\n(à elle-même)\nAujourd'hui, on vend tout.\n\nUn citron roule du chariot et disparaît sous un étal.",
      ),
    ],
  };
}

/** Document rédigé par l'agent à partir d'une idée et de la liste des plans. */
export function storyFromIdea(idea: string, shots: string[]): N {
  const clean = idea.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  return {
    type: "doc",
    content: [
      h("Brief"),
      p(`${clean}. Un court film de 15 à 30 secondes, pensé pour être compris sans dialogue.`),
      h("Narration"),
      ...shots.map((s, i) => p(`${i + 1}. ${s}`)),
      h("Direction créative"),
      p("Lumière naturelle et douce, palette resserrée, mouvements de caméra lents. Une seule idée par plan."),
      h("Scénario"),
      script(`EXT. LIEU PRINCIPAL - JOUR\n\n${shots.map((s) => s.split(" — ")[0] + ".").join("\n\n")}\n\nFONDU AU NOIR.`),
    ],
  };
}

type Doc = { type?: string; content?: Doc[]; attrs?: Record<string, unknown>; text?: string };

/** Texte du bloc scénario du document (premier bloc de code « scenario », ou après le titre Scénario). */
export function scenarioOf(doc: Doc | null | undefined): string {
  const blocks = doc?.content ?? [];
  const b = blocks.find((n) => n.type === "codeBlock" && n.attrs?.language === "scenario")
    ?? blocks.slice(blocks.findIndex((n) => n.type === "heading" && (n.content ?? []).map((c) => c.text).join("") === "Scénario") + 1).find((n) => n.type === "codeBlock");
  return (b?.content ?? []).map((c) => c.text ?? "").join("");
}

/** Remplace (ou ajoute) le bloc scénario, sans toucher au reste du document. */
export function withScenario(doc: Doc | null | undefined, text: string): Doc {
  const blocks = [...(doc?.content ?? (storyTemplate().content as Doc[]))];
  const i = blocks.findIndex((n) => n.type === "codeBlock" && n.attrs?.language === "scenario");
  const block = script(text) as Doc;
  if (i >= 0) blocks[i] = block;
  else {
    const hi = blocks.findIndex((n) => n.type === "heading" && (n.content ?? []).map((c) => c.text).join("") === "Scénario");
    if (hi >= 0) blocks.splice(hi + 1, 0, block);
    else blocks.push(h("Scénario") as Doc, block);
  }
  return { type: "doc", content: blocks };
}
