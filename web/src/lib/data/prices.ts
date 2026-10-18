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
    { id: "char-quality", label: "Personnage cohérent", credits: 12, minPlan: "standard" as const },
  ],
  edit: [
    { id: "edit-fast", label: "Retouche rapide", credits: 4 },
    { id: "edit-quality", label: "Retouche précise", credits: 8 },
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
  image: "img-quality", video: "vid-standard", character: "char-quality", voice: "voice-standard", music: "music-15", edit: "edit-quality",
} as const;

/** « Auto » : l'app choisit le modèle par défaut du type. */
export const AUTO = "auto";
export const resolveModel = (kind: ModelKind, model: string) => (model === AUTO ? DEFAULT_MODEL[kind] : model);

const PLAN_RANK = { free: 0, casual: 1, standard: 2, pro: 3, studio: 4, enterprise: 5 } as const;
export type PlanId = keyof typeof PLAN_RANK;
export const PLAN_LABEL: Record<PlanId, string> = {
  free: "Gratuit", casual: "Découverte", standard: "Créateur", pro: "Pro", studio: "Studio", enterprise: "Entreprise",
};

/** Plan minimum requis par un modèle, ou null s'il est accessible. */
export function lockedFor(kind: ModelKind, model: string, plan: PlanId): PlanId | null {
  const m = (MODELS[kind] as readonly { id: string; minPlan?: PlanId }[]).find((x) => x.id === resolveModel(kind, model));
  return m?.minPlan && PLAN_RANK[plan] < PLAN_RANK[m.minPlan] ? m.minPlan : null;
}

/** Durées possibles d'une vidéo ; le prix des modèles est donné pour 5 s. */
export const VIDEO_SECONDS = [5, 10] as const;

/** Résolutions vidéo et multiplicateur de prix (le prix de base est en 720p). */
export const VIDEO_RESOLUTIONS = [
  { id: "480p", label: "480p (brouillon)", factor: 0.5, height: 480 },
  { id: "720p", label: "720p", factor: 1, height: 720 },
  { id: "1080p", label: "1080p", factor: 2.25, height: 1080 },
] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number]["id"];

/** Génération en lot : nombre de résultats par lancement. */
export const BATCH_SIZES = [1, 2, 3, 4] as const;

/** Voix proposées (noms fictifs, écrits pour ce projet). */
export const VOICES = [
  { id: "claire", label: "Claire", desc: "femme, posée, narratrice", pitch: 220 },
  { id: "malik", label: "Malik", desc: "homme, chaleureux", pitch: 130 },
  { id: "jeanne", label: "Jeanne", desc: "enfant, enjouée", pitch: 300 },
  { id: "victor", label: "Victor", desc: "homme âgé, grave", pitch: 100 },
] as const;

export function priceOf(kind: ModelKind, model: string, seconds = 5, resolution: VideoResolution = "720p", count = 1): number {
  const id = resolveModel(kind, model);
  const m = (MODELS[kind] as readonly { id: string; credits: number }[]).find((x) => x.id === id);
  if (!m) throw new Error(`modèle inconnu : ${model}`);
  const factor = VIDEO_RESOLUTIONS.find((r) => r.id === resolution)?.factor ?? 1;
  const unit = kind === "video" ? Math.round(((m.credits * seconds) / 5) * factor) : m.credits;
  return unit * count;
}

export const musicDurationMs = (model: string) => (model === "music-30" ? 30000 : 15000);
