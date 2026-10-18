// Import de fichiers (simulé : stockés en data URL dans le navigateur ; Supabase Storage avec le backend).
import type { CanvasNode } from "./data/types";

/** Limite de la simulation (stockage local du navigateur). Le backend acceptera 500 Mo en vidéo. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const readAsDataUrl = (f: File) =>
  new Promise<string>((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(r.error);
    r.readAsDataURL(f);
  });

function probe(url: string, kind: "image" | "video" | "audio") {
  return new Promise<{ width?: number; height?: number; durationMs?: number; posterUrl?: string }>((ok) => {
    if (kind === "image") {
      const im = new Image();
      im.onload = () => ok({ width: im.naturalWidth, height: im.naturalHeight });
      im.onerror = () => ok({});
      im.src = url;
    } else {
      const el = document.createElement(kind);
      el.preload = "metadata";
      const meta = () => ({
        durationMs: Number.isFinite(el.duration) ? Math.round(el.duration * 1000) : undefined,
        ...(kind === "video" ? { width: (el as HTMLVideoElement).videoWidth, height: (el as HTMLVideoElement).videoHeight } : {}),
      });
      el.onloadedmetadata = () => {
        if (kind !== "video") return ok(meta());
        // Image d'aperçu : première image de la vidéo (sert à l'aperçu du montage et à l'export simulé).
        const v = el as HTMLVideoElement;
        v.muted = true;
        v.onseeked = () => {
          const c = document.createElement("canvas");
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          let posterUrl: string | undefined;
          try {
            c.getContext("2d")!.drawImage(v, 0, 0);
            posterUrl = c.toDataURL("image/jpeg", 0.8);
          } catch {
            posterUrl = undefined;
          }
          ok({ ...meta(), posterUrl });
        };
        v.currentTime = Math.min(0.1, v.duration / 2 || 0);
      };
      el.onerror = () => ok({});
      el.src = url;
    }
  });
}

export type UploadResult = { ok: true; node: Omit<CanvasNode, "projectId" | "x" | "y" | "sectionId"> } | { ok: false; error: string };

export async function fileToNode(f: File): Promise<UploadResult> {
  const kind = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : null;
  if (!kind) return { ok: false, error: `« ${f.name} » : format non pris en charge (images, vidéos ou sons uniquement).` };
  if (f.size > MAX_UPLOAD_BYTES) return { ok: false, error: `« ${f.name} » dépasse 4 Mo, la limite du mode développement.` };
  const url = await readAsDataUrl(f);
  const meta = await probe(url, kind);
  return {
    ok: true,
    node: {
      id: crypto.randomUUID(),
      type: kind,
      name: f.name.replace(/\.[^.]+$/, "").slice(0, 60) || "Fichier importé",
      data: { mediaUrl: url, uploaded: true, status: "done", ...meta },
    },
  };
}
