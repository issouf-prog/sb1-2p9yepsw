// Outils partagés entre l'interface et l'agent (un bouton et l'agent appellent la même fonction).
import { data, ConflictError, type CanvasNode } from "../data";
import { defaultDuration, totalMs } from "../timeline";

/** Construit la timeline avec les plans de la toile : sections dans l'ordre, vidéos de préférence à leur image source. */
export async function buildTimeline(projectId: string): Promise<{ added: CanvasNode[]; totalMs: number }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [canvas, tl] = await Promise.all([data.canvas(projectId), data.timeline(projectId)]);
    const sectionOrder = new Map([...canvas.sections].sort((a, b) => a.y - b.y || a.x - b.x).map((s, i) => [s.id, i]));
    const animated = new Set(canvas.edges.filter((e) => e.role === "start_frame").map((e) => e.from));
    const already = new Set(tl.main.map((c) => c.nodeId));
    const picks = canvas.nodes
      .filter((n) => (n.type === "video" || (n.type === "image" && !animated.has(n.id))) && n.data.mediaUrl && !already.has(n.id))
      .sort((a, b) => (sectionOrder.get(a.sectionId ?? "") ?? 99) - (sectionOrder.get(b.sectionId ?? "") ?? 99) || a.y - b.y || a.x - b.x);
    const main = [...tl.main, ...picks.map((n) => ({ id: crypto.randomUUID(), nodeId: n.id, durationMs: defaultDuration(n) }))];
    try {
      await data.saveTimeline({ ...tl, main });
      return { added: picks, totalMs: main.reduce((s, c) => s + c.durationMs, 0) };
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
    }
  }
  throw new Error("timeline_busy");
}

/** Ajoute un plan à la fin de la timeline (menu « Envoyer au montage »). */
export async function appendToTimeline(projectId: string, node: CanvasNode) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const tl = await data.timeline(projectId);
    try {
      return await data.saveTimeline({ ...tl, main: [...tl.main, { id: crypto.randomUUID(), nodeId: node.id, durationMs: defaultDuration(node) }] });
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
    }
  }
  throw new Error("timeline_busy");
}

/** Ajoute un son sur la piste audio, à partir du début (musique) ou après le dernier son (voix). */
export async function appendAudio(projectId: string, node: CanvasNode) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const tl = await data.timeline(projectId);
    const audio = tl.audio ?? [];
    const kind = node.data.action === "generate_music" ? ("music" as const) : ("voice" as const);
    const afterLastVoice = audio.filter((a) => a.kind === "voice").reduce((m, a) => Math.max(m, a.startMs + a.durationMs), 0);
    const startMs = kind === "music" ? 0 : Math.min(afterLastVoice, Math.max(0, totalMs(tl) - 500));
    const clip = { id: crypto.randomUUID(), nodeId: node.id, kind, startMs, durationMs: node.data.durationMs ?? 3000, volume: kind === "music" ? 0.6 : 1 };
    try {
      return await data.saveTimeline({ ...tl, audio: [...audio, clip] });
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
    }
  }
  throw new Error("timeline_busy");
}
