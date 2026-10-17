"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { data, type CanvasNode, type Project, type Timeline } from "@/lib/data";
import { exportFilm } from "@/lib/export";
import { cn } from "@/lib/cn";

const RES = [
  { id: "720p", h: 720, ok: true },
  { id: "1080p", h: 1080, ok: false },
  { id: "4K", h: 2160, ok: false },
];
const ASPECT: Record<string, number> = { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1, "21:9": 21 / 9, "4:3": 4 / 3, "3:4": 3 / 4, "5:4": 5 / 4 };

interface Done { url: string; name: string; at: string }

/** Export (S16). Simulé dans le navigateur en 720p ; 1080p et 4K viendront avec le rendu serveur. */
export function ExportDialog({ open, onOpenChange, project, timeline, nodes }: {
  open: boolean; onOpenChange: (o: boolean) => void; project: Project; timeline: Timeline; nodes: Map<string, CanvasNode>;
}) {
  const [res, setRes] = useState("720p");
  const [progress, setProgress] = useState<number | null>(null);
  const [recent, setRecent] = useState<Done[]>([]);
  const [plan, setPlan] = useState<string>("free");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { data.workspace().then((w) => setPlan(w.plan)); }, [open]);
  const watermark = plan === "free" || plan === "casual";

  const run = async () => {
    setError(null);
    setProgress(0);
    try {
      const h = 720;
      const w = Math.round((h * ASPECT[project.aspectRatio]) / 2) * 2;
      const [W, H] = ASPECT[project.aspectRatio] < 1 ? [h, Math.round(h / ASPECT[project.aspectRatio] / 2) * 2] : [w, h];
      const blob = await exportFilm({ timeline, nodes, width: W, height: H, watermark: watermark ? "Studio" : null, onProgress: setProgress });
      const url = URL.createObjectURL(blob);
      // Nom ASCII : certains navigateurs ignorent les noms de fichier accentués.
      const slug = project.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      const name = `${slug || "film"}.webm`;
      setRecent((r) => [{ url, name, at: new Date().toLocaleTimeString("fr-FR") }, ...r]);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("L'export n'a pas abouti dans ce navigateur. Réessayez, ou utilisez Chrome ou Edge.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => progress === null && onOpenChange(o)} title="Exporter le film"
      description={`${(timeline.main.reduce((s, c) => s + c.durationMs, 0) / 1000).toFixed(1)} s · format ${project.aspectRatio} (celui du montage)`}>
      <fieldset className="flex gap-2">
        <legend className="mb-2 text-sm text-text-muted">Résolution</legend>
        {RES.map((r) => (
          <label key={r.id} title={r.ok ? undefined : "Avec le rendu serveur (bientôt)"}
            className={cn("flex items-center gap-2 border px-4 py-2", res === r.id ? "border-text" : "border-border", !r.ok && "opacity-45")}>
            <input type="radio" name="res" disabled={!r.ok} checked={res === r.id} onChange={() => setRes(r.id)} />
            {r.id}
          </label>
        ))}
      </fieldset>
      <p className="mt-4 text-sm text-text-muted">
        {watermark ? "Filigrane inclus sur votre plan actuel." : "Sans filigrane."} Fichier WebM généré dans votre navigateur (le rendu serveur MP4 viendra avec le backend).
      </p>
      {progress !== null && (
        <div className="mt-4" role="progressbar" aria-label="Rendu en cours" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-1.5 bg-surface-sunken"><div className="h-full bg-primary transition-[width]" style={{ width: `${progress * 100}%` }} /></div>
          <p className="mt-1 text-sm text-text-muted">Rendu… {Math.round(progress * 100)} %</p>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {recent.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-text-muted">Exports récents</p>
          <ul className="mt-1 space-y-1">
            {recent.map((r) => <li key={r.url}><a href={r.url} download={r.name} className="underline">{r.name}</a> <span className="text-sm text-text-muted">· {r.at}</span></li>)}
          </ul>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" disabled={progress !== null} onClick={() => onOpenChange(false)}>Fermer</Button>
        <Button loading={progress !== null} onClick={run}>Exporter</Button>
      </div>
    </Dialog>
  );
}
