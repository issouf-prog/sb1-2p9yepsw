// Export simulé côté navigateur : dessine chaque plan sur un canvas et l'enregistre en WebM.
// La vraie version rendra le film côté serveur avec FFmpeg (720p / 1080p / 4K).
import type { CanvasNode, Timeline } from "./data/types";
import { clipAt, totalMs } from "./timeline";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = ko;
    im.src = src;
  });

export async function exportFilm(opts: {
  timeline: Timeline;
  nodes: Map<string, CanvasNode>;
  width: number;
  height: number;
  watermark: string | null;
  onProgress: (p: number) => void;
}): Promise<Blob> {
  const { timeline, nodes, width, height, watermark, onProgress } = opts;
  const images = new Map<string, HTMLImageElement>();
  for (const c of timeline.main) {
    const n = nodes.get(c.nodeId);
    const src = n?.data.posterUrl ?? n?.data.mediaUrl;
    if (src && !images.has(c.nodeId)) images.set(c.nodeId, await loadImage(src));
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(timeline.fps);
  const type = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((ok) => (rec.onstop = () => ok(new Blob(chunks, { type: "video/webm" }))));

  const total = totalMs(timeline);
  const draw = (ms: number) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    const hit = clipAt(timeline.main, ms);
    if (hit) {
      const im = images.get(hit.clip.nodeId);
      const isVideo = nodes.get(hit.clip.nodeId)?.type === "video";
      if (im) {
        const scale = Math.max(width / im.width, height / im.height) * (isVideo ? 1 + 0.12 * hit.progress : 1);
        const w = im.width * scale, h = im.height * scale;
        const dx = isVideo ? -0.03 * width * hit.progress : 0;
        ctx.drawImage(im, (width - w) / 2 + dx, (height - h) / 2, w, h);
      }
    }
    const t = timeline.text.find((x) => ms >= x.startMs && ms < x.startMs + x.durationMs);
    if (t) {
      ctx.font = `${Math.round(height / 18)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,.55)";
      const m = ctx.measureText(t.text).width;
      ctx.fillRect(width / 2 - m / 2 - 16, height * 0.86 - height / 18, m + 32, height / 12);
      ctx.fillStyle = "#fff";
      ctx.fillText(t.text, width / 2, height * 0.86);
    }
    if (watermark) {
      ctx.font = `${Math.round(height / 30)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText(watermark, width - 24, height - 24);
    }
  };

  rec.start(250);
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const ms = performance.now() - t0;
      draw(Math.min(ms, total - 1));
      onProgress(Math.min(1, ms / total));
      if (ms >= total) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  return done;
}
