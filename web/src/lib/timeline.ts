import type { AudioClip, CanvasNode, TextClip, Timeline, TimelineClip, TransitionKind } from "./data/types";

export const IMAGE_CLIP_MS = 3000;
export const MIN_CLIP_MS = 500;

export const defaultDuration = (n: CanvasNode) => (n.type === "video" ? n.data.durationMs ?? 5000 : IMAGE_CLIP_MS);
export const totalMs = (t: Pick<Timeline, "main">) => t.main.reduce((s, c) => s + c.durationMs, 0);

/** Débuts de chaque clip de la piste principale (la piste n'a pas de trous : aimant toujours actif). */
export function starts(main: TimelineClip[]) {
  let acc = 0;
  return main.map((c) => {
    const s = acc;
    acc += c.durationMs;
    return s;
  });
}

export function clipAt(main: TimelineClip[], ms: number) {
  const s = starts(main);
  const i = main.findIndex((c, k) => ms >= s[k] && ms < s[k] + c.durationMs);
  return i < 0 ? null : { clip: main[i], index: i, start: s[i], progress: (ms - s[i]) / main[i].durationMs };
}

/** Coupe le clip sous la tête de lecture en deux. */
export function splitAt(main: TimelineClip[], ms: number): TimelineClip[] {
  const hit = clipAt(main, ms);
  if (!hit) return main;
  const left = ms - hit.start;
  const right = hit.clip.durationMs - left;
  if (left < MIN_CLIP_MS || right < MIN_CLIP_MS) return main;
  const next = [...main];
  next.splice(hit.index, 1, { ...hit.clip, durationMs: left }, { ...hit.clip, id: crypto.randomUUID(), durationMs: right, transition: undefined });
  return next;
}

export function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [x] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, x);
  return next;
}

export const timecode = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const f = Math.floor((ms % 1000) / (1000 / 30));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
};


export const TRANSITIONS: { kind: TransitionKind; label: string; desc: string }[] = [
  { kind: "dissolve", label: "Fondu enchaîné", desc: "Le plan suivant apparaît par-dessus le précédent." },
  { kind: "black", label: "Fondu au noir", desc: "Le plan s'éteint au noir, puis le suivant s'allume." },
  { kind: "wipe", label: "Volet", desc: "Le plan suivant balaie l'image de gauche à droite." },
  { kind: "slide", label: "Glissement", desc: "Le plan suivant pousse le précédent hors du cadre." },
];
export const TRANSITION_LABEL = Object.fromEntries(TRANSITIONS.map((t) => [t.kind, t.label])) as Record<TransitionKind, string>;
export const DEFAULT_TRANSITION_MS = 600;

/** Durée de transition réellement jouée : jamais plus de la moitié de chacun des deux clips. */
export const transitionMs = (main: TimelineClip[], i: number) => {
  const c = main[i];
  if (!c?.transition || i === 0) return 0;
  return Math.min(c.transition.durationMs, c.durationMs / 2, main[i - 1].durationMs / 2);
};

export type Layer = { opacity: number; x: number; reveal: number };

/** État de la transition à l'instant ms : plan précédent, avancement t (0 → 1) et rendu des deux couches. */
export function transitionAt(main: TimelineClip[], ms: number) {
  const hit = clipAt(main, ms);
  if (!hit) return null;
  const d = transitionMs(main, hit.index);
  const into = ms - hit.start;
  if (!d || into >= d) return null;
  const t = into / d;
  const kind = hit.clip.transition!.kind;
  const prev: Layer = { opacity: 1, x: 0, reveal: 1 };
  const next: Layer = { opacity: 1, x: 0, reveal: 1 };
  if (kind === "dissolve") next.opacity = t;
  if (kind === "black") { prev.opacity = Math.max(0, 1 - 2 * t); next.opacity = Math.max(0, 2 * t - 1); }
  if (kind === "wipe") next.reveal = t;
  if (kind === "slide") { prev.x = -t; next.x = 1 - t; }
  return { prev: main[hit.index - 1], kind, t, layers: { prev, next } };
}

/**
 * Sous-titres générés depuis la voix off : le texte de chaque voix est découpé en lignes courtes
 * (42 caractères au plus) réparties sur la durée du clip, au prorata de leur longueur.
 */
export function subtitlesFrom(audio: AudioClip[], textOf: (nodeId: string) => string | undefined): TextClip[] {
  const out: TextClip[] = [];
  for (const a of audio.filter((x) => x.kind === "voice")) {
    const text = textOf(a.nodeId)?.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const lines: string[] = [];
    for (const sentence of text.match(/[^.!?…]+[.!?…]*/g) ?? [text]) {
      let line = "";
      for (const w of sentence.trim().split(" ")) {
        if (line && (line + " " + w).length > 42) { lines.push(line); line = w; } else line = line ? `${line} ${w}` : w;
      }
      if (line) lines.push(line);
    }
    const chars = lines.reduce((s, l) => s + l.length, 0) || 1;
    let at = a.startMs;
    for (const l of lines) {
      const d = Math.max(700, Math.round((a.durationMs * l.length) / chars));
      out.push({ id: crypto.randomUUID(), kind: "subtitle", text: l, startMs: at, durationMs: d });
      at += d;
    }
  }
  return out;
}
