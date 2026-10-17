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
} as const;

export const DEFAULT_MODEL = { image: "img-quality", video: "vid-standard" } as const;

export function priceOf(kind: "image" | "video", model: string): number {
  const m = MODELS[kind].find((x) => x.id === model);
  if (!m) throw new Error(`modèle inconnu : ${model}`);
  return m.credits;
}
