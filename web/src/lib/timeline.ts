import type { CanvasNode, Timeline, TimelineClip } from "./data/types";

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
  next.splice(hit.index, 1, { ...hit.clip, durationMs: left }, { ...hit.clip, id: crypto.randomUUID(), durationMs: right });
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
