// Prix en crédits (équivalent de la table model_prices). Le coût réel fournisseur doit rester en dessous.
export const MODELS = {
  image: [
    { id: "img-fast", label: "Rapide", credits: 4 },
    { id: "img-quality", label: "Qualité", credits: 8 },
    { id: "img-pro", label: "Pro (4K)", credits: 30, minPlan: "standard" as const },
  ],
  video: [
    { id: "vid-draft", label: "Brouillon 5 s", credits: 20 },
    { id: "vid-standard", label: "Standard 5 s", credits: 120 },
    { id: "vid-cinema", label: "Cinéma 8 s + son", credits: 320, minPlan: "pro" as const },
  ],
  character: [
    { id: "char-quality", label: "Personnage cohérent", credits: 12 },
  ],
  voice: [
    { id: "voice-standard", label: "Voix naturelle", credits: 8 },
    { id: "voice-expressive", label: "Voix expressive", credits: 16 },
  ],
  music: [
    { id: "music-15", label: "Musique 15 s", credits: 8 },
    { id: "music-30", label: "Musique 30 s", credits: 15 },
  ],
} as const;

export type ModelKind = keyof typeof MODELS;

export const DEFAULT_MODEL = {
  image: "img-quality", video: "vid-standard", character: "char-quality", voice: "voice-standard", music: "music-15",
} as const;

/** Voix proposées (noms fictifs, écrits pour ce projet). */
export const VOICES = [
  { id: "claire", label: "Claire", desc: "femme, posée, narratrice", pitch: 220 },
  { id: "malik", label: "Malik", desc: "homme, chaleureux", pitch: 130 },
  { id: "jeanne", label: "Jeanne", desc: "enfant, enjouée", pitch: 300 },
  { id: "victor", label: "Victor", desc: "homme âgé, grave", pitch: 100 },
] as const;

export function priceOf(kind: ModelKind, model: string): number {
  const m = (MODELS[kind] as readonly { id: string; credits: number }[]).find((x) => x.id === model);
  if (!m) throw new Error(`modèle inconnu : ${model}`);
  return m.credits;
}

export const musicDurationMs = (model: string) => (model === "music-30" ? 30000 : 15000);
