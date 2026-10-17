// Contrat des générateurs. Implémentation simulée ici ; la vraie appellera fal.ai / ElevenLabs côté serveur.
import type { AspectRatio } from "../data/types";

export interface ImageResult { url: string; width: number; height: number }
export interface VideoResult { url: string; posterUrl: string; width: number; height: number; durationMs: number }

export interface GenProvider {
  image(input: { prompt: string; model: string; aspectRatio: AspectRatio }): Promise<ImageResult>;
  video(input: { prompt: string; model: string; startFrameUrl: string; aspectRatio: AspectRatio }): Promise<VideoResult>;
}

const DIMS: Record<AspectRatio, [number, number]> = {
  "16:9": [1536, 864], "9:16": [864, 1536], "1:1": [1024, 1024], "21:9": [1680, 720], "4:3": [1280, 960], "3:4": [960, 1280], "5:4": [1280, 1024],
};

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Image de remplacement : composition abstraite déterministe (aucune image externe). */
export function placeholderImage(prompt: string, ratio: AspectRatio, label = "Aperçu simulé"): ImageResult {
  const [w, h] = DIMS[ratio];
  const r = hash(prompt);
  const h1 = r % 360, h2 = (h1 + 40 + (r >> 9) % 80) % 360;
  const cx = 20 + ((r >> 3) % 60), cy = 25 + ((r >> 7) % 40);
  const words = esc(prompt.split(/\s+/).slice(0, 6).join(" "));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h1} 45% 30%)"/><stop offset="1" stop-color="hsl(${h2} 50% 12%)"/></linearGradient>
<radialGradient id="l" cx="${cx}%" cy="${cy}%" r="45%"><stop offset="0" stop-color="hsl(${(h1 + 30) % 360} 80% 75%)" stop-opacity=".55"/><stop offset="1" stop-opacity="0"/></radialGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#l)"/>
<path d="M0 ${h * 0.78} Q ${w * 0.3} ${h * (0.66 + (r % 10) / 100)} ${w * 0.6} ${h * 0.76} T ${w} ${h * 0.72} V ${h} H 0 Z" fill="hsl(${h2} 40% 8%)" fill-opacity=".7"/>
<text x="${w * 0.05}" y="${h * 0.92}" font-family="sans-serif" font-size="${Math.round(w / 34)}" fill="#fff" fill-opacity=".85">${words}</text>
<text x="${w * 0.05}" y="${h * 0.07}" font-family="sans-serif" font-size="${Math.round(w / 48)}" fill="#fff" fill-opacity=".6">${esc(label)}</text></svg>`;
  return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: w, height: h };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const simulatedGen: GenProvider = {
  async image({ prompt, aspectRatio }) {
    await wait(900 + Math.random() * 900);
    if (/\b(?:échec|echec)\b/i.test(prompt)) throw new Error("simulated_failure");
    return placeholderImage(prompt, aspectRatio);
  },
  async video({ prompt, aspectRatio, startFrameUrl }) {
    await wait(1800 + Math.random() * 1200);
    const [w, h] = DIMS[aspectRatio];
    // Simulation : la « vidéo » réutilise l'image de départ, animée côté interface.
    void prompt;
    return { url: startFrameUrl, posterUrl: startFrameUrl, width: w, height: h, durationMs: 5000 };
  },
};
