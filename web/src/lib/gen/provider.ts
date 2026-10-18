// Contrat des générateurs. Implémentation simulée ici ; la vraie appellera fal.ai / ElevenLabs côté serveur.
import type { AspectRatio } from "../data/types";

export interface ImageResult { url: string; width: number; height: number }
export interface VideoResult { url: string; posterUrl: string; width: number; height: number; durationMs: number }
export interface AudioResult { url: string; durationMs: number }

export interface GenProvider {
  image(input: { prompt: string; model: string; aspectRatio: AspectRatio }): Promise<ImageResult>;
  video(input: { prompt: string; model: string; startFrameUrl: string; aspectRatio: AspectRatio }): Promise<VideoResult>;
  /** Image du même personnage dans une nouvelle scène (références : 1 à 5 images). */
  character(input: { prompt: string; model: string; references: { url: string; name: string; prompt?: string }[]; scenes?: { url: string; name: string }[]; aspectRatio: AspectRatio }): Promise<ImageResult>;
  voice(input: { text: string; voice: string; model: string }): Promise<AudioResult>;
  /** Retouche d'une image existante selon une instruction. */
  edit(input: { instruction: string; model: string; source: { url: string; prompt?: string; name: string }; aspectRatio: AspectRatio }): Promise<ImageResult>;
  music(input: { prompt: string; model: string; durationMs: number }): Promise<AudioResult>;
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
export function placeholderImage(prompt: string, ratio: AspectRatio, label = "Aperçu simulé", paletteSeed?: string): ImageResult {
  const [w, h] = DIMS[ratio];
  const r = hash(paletteSeed ?? prompt) ^ (paletteSeed ? hash(prompt) & 0x7f : 0);
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

/** WAV 8 kHz 8 bits mono, assez léger pour le stockage local de la simulation. */
function wav(samples: Float32Array, rate = 8000): string {
  const n = samples.length;
  const buf = new Uint8Array(44 + n);
  const dv = new DataView(buf.buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => (buf[o + i] = c.charCodeAt(0)));
  str(0, "RIFF"); dv.setUint32(4, 36 + n, true); str(8, "WAVE"); str(12, "fmt ");
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  str(36, "data"); dv.setUint32(40, n, true);
  for (let i = 0; i < n; i++) buf[44 + i] = Math.max(0, Math.min(255, Math.round(128 + samples[i] * 110)));
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

/** « Voix » simulée : syllabes chantonnées à la hauteur de la voix choisie, au rythme du texte. */
export function synthVoice(text: string, pitch: number): AudioResult {
  const rate = 8000;
  const syll = Math.max(3, Math.round(text.replace(/[^\p{L}]/gu, "").length / 2.6));
  const sylMs = 170;
  const total = Math.min(20000, syll * sylMs + 400);
  const out = new Float32Array(Math.round((total / 1000) * rate));
  const r = hash(text);
  for (let s = 0; s < syll; s++) {
    const f = pitch * (1 + (((r >> (s % 24)) & 7) - 3) * 0.04);
    const start = Math.round(((s * sylMs + 200) / 1000) * rate);
    const len = Math.round((sylMs * 0.8 / 1000) * rate);
    for (let i = 0; i < len && start + i < out.length; i++) {
      const env = Math.sin((Math.PI * i) / len);
      const t = i / rate;
      out[start + i] += env * 0.6 * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.2 * Math.sin(6 * Math.PI * f * t)) / 1.6;
    }
  }
  return { url: wav(out, rate), durationMs: total };
}

/** Musique simulée : progression d'accords arpégée, tonalité tirée du prompt. */
export function synthMusic(prompt: string, durationMs: number): AudioResult {
  const rate = 8000;
  const out = new Float32Array(Math.round((durationMs / 1000) * rate));
  const root = 196 * Math.pow(2, (hash(prompt) % 7) / 12);
  const minor = /triste|sombre|nuit|pluie|noir|mélanc/i.test(prompt);
  const chords = minor ? [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 10, 14]] : [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]];
  const beat = /rapide|action|poursuite|énerg/i.test(prompt) ? 0.18 : 0.3;
  for (let i = 0; i < out.length; i++) {
    const t = i / rate;
    const step = Math.floor(t / beat);
    const chord = chords[Math.floor(step / 8) % chords.length];
    const f = root * Math.pow(2, chord[step % 3] / 12);
    const local = (t % beat) / beat;
    const env = Math.exp(-4 * local);
    const pad = chord.reduce((s, semi) => s + Math.sin(2 * Math.PI * (root / 2) * Math.pow(2, semi / 12) * t), 0) / 6;
    const fade = Math.min(1, t / 0.8, (durationMs / 1000 - t) / 1.2);
    out[i] = fade * (0.5 * env * Math.sin(2 * Math.PI * f * t) + 0.35 * pad);
  }
  return { url: wav(out, rate), durationMs };
}

export const simulatedGen: GenProvider = {
  async image({ prompt, aspectRatio }) {
    await wait(900 + Math.random() * 900);
    // Mot-clé de test : un prompt contenant « échec » simule une panne du fournisseur.
    if (/(^|[^\p{L}])[ée]chec([^\p{L}]|$)/iu.test(prompt)) throw new Error("simulated_failure");
    return placeholderImage(prompt, aspectRatio);
  },
  async video({ prompt, aspectRatio, startFrameUrl }) {
    await wait(1800 + Math.random() * 1200);
    const [w, h] = DIMS[aspectRatio];
    // Simulation : la « vidéo » réutilise l'image de départ, animée côté interface.
    void prompt;
    return { url: startFrameUrl, posterUrl: startFrameUrl, width: w, height: h, durationMs: 5000 };
  },
  async character({ prompt, references, scenes = [], aspectRatio }) {
    await wait(1100 + Math.random() * 900);
    // Simulation de la cohérence : la palette vient du personnage, la composition de la scène.
    const ref = references[0];
    const where = scenes.map((s) => s.name).join(" + ");
    const label = `Aperçu simulé · ${ref?.name ?? "personnage"}${where ? ` dans « ${where} »` : ""}`;
    return placeholderImage(where ? `${where} ${prompt}` : prompt, aspectRatio, label, ref?.prompt ?? ref?.name);
  },
  async edit({ instruction, source, aspectRatio }) {
    await wait(900 + Math.random() * 600);
    return placeholderImage(instruction, aspectRatio, `Retouche simulée · ${source.name}`, source.prompt ?? source.name);
  },
  async voice({ text, voice }) {
    await wait(700 + Math.random() * 500);
    const pitch = { claire: 220, malik: 130, jeanne: 300, victor: 100 }[voice] ?? 180;
    return synthVoice(text, pitch);
  },
  async music({ prompt, durationMs }) {
    await wait(1200 + Math.random() * 800);
    return synthMusic(prompt, durationMs);
  },
};
