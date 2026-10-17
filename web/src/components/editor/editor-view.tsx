"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play, Pause, ZoomIn, ZoomOut, Scissors, Trash2, Upload, Plus, ChevronDown, Sparkles, ArrowLeft, ArrowRight, Type, Maximize2, Heart,
} from "lucide-react";
import { data, ConflictError, type CanvasNode, type Project, type Timeline, type TimelineClip } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { buildTimeline } from "@/lib/agent/tools";
import { clipAt, defaultDuration, move, splitAt, starts, timecode, totalMs, MIN_CLIP_MS } from "@/lib/timeline";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ExportDialog } from "./export-dialog";

const TABS = ["Ressources", "Sons", "Effets", "Transitions"] as const;

export function EditorView({ project }: { project: Project }) {
  const canvas = useLive(() => data.canvas(project.id), [project.id], project.id);
  const remote = useLive(() => data.timeline(project.id), [project.id], project.id);
  const [tl, setTl] = useState<Timeline | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pxPerSec, setPxPerSec] = useState(80);
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => { if (remote.value) setTl(remote.value); }, [remote.value]);

  const nodes = useMemo(() => new Map((canvas.value?.nodes ?? []).map((n) => [n.id, n])), [canvas.value]);
  const media = (canvas.value?.nodes ?? []).filter((n) => (n.type === "image" || n.type === "video") && n.data.mediaUrl && (filter === "all" || n.data.favorite));
  const sections = canvas.value?.sections ?? [];
  const total = tl ? totalMs(tl) : 0;

  const commit = useCallback(async (main: TimelineClip[], text = tl?.text ?? []) => {
    if (!tl) return;
    const optimistic = { ...tl, main, text };
    setTl(optimistic);
    try {
      setTl(await data.saveTimeline(optimistic));
    } catch (e) {
      if (e instanceof ConflictError) {
        setNotice("Le montage a été modifié ailleurs (par l'agent ?). Version la plus récente rechargée.");
        setTl(await data.timeline(project.id));
      } else throw e;
    }
  }, [tl, project.id]);

  // Lecture
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setPlayhead((p) => {
        const next = p + (now - last);
        if (next >= total) { setPlaying(false); return total; }
        return next;
      });
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  useEffect(() => { if (playhead > total) setPlayhead(total); }, [total, playhead]);

  const add = (n: CanvasNode) => tl && commit([...tl.main, { id: crypto.randomUUID(), nodeId: n.id, durationMs: defaultDuration(n) }]);
  const remove = (id: string) => tl && (commit(tl.main.filter((c) => c.id !== id)), setSelected(null));
  const split = () => tl && commit(splitAt(tl.main, playhead));
  const sel = tl?.main.find((c) => c.id === selected) ?? null;
  const selIndex = sel && tl ? tl.main.indexOf(sel) : -1;

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if (e.key === " ") { e.preventDefault(); setPlaying((p) => (playhead >= total ? (setPlayhead(0), true) : !p)); }
    if (e.key === "s" || e.key === "S") split();
    if ((e.key === "Delete" || e.key === "Backspace") && selected) remove(selected);
    if (e.key === "Home") setPlayhead(0);
    if (e.key === "ArrowRight") setPlayhead((p) => Math.min(total, p + (e.shiftKey ? 5 : 1) * (1000 / 30)));
    if (e.key === "ArrowLeft") setPlayhead((p) => Math.max(0, p - (e.shiftKey ? 5 : 1) * (1000 / 30)));
  };

  const letAgentBuild = async () => {
    setBusy(true);
    try {
      const r = await buildTimeline(project.id);
      setNotice(r.added.length ? `${r.added.length} plans ajoutés au montage (${(r.totalMs / 1000).toFixed(1)} s).` : "Aucun nouveau plan à ajouter : générez d'abord des images ou des vidéos sur la toile.");
    } finally {
      setBusy(false);
    }
  };

  if (!tl || canvas.loading) return <div className="h-full bg-bg" aria-busy="true" />;

  const hit = clipAt(tl.main, Math.min(playhead, Math.max(0, total - 1)));
  const current = hit ? nodes.get(hit.clip.nodeId) : null;
  const s = starts(tl.main);
  const width = Math.max(800, (total / 1000) * pxPerSec + 200);
  const groups = [...sections.map((sec) => ({ id: sec.id, name: sec.name, items: media.filter((n) => n.sectionId === sec.id) })),
    { id: "none", name: "Non groupés", items: media.filter((n) => !n.sectionId || !sections.some((x) => x.id === n.sectionId)) }].filter((g) => g.items.length);

  return (
    <div className="flex h-full flex-col bg-surface" onKeyDown={onKey}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Ressources */}
        <section aria-label="Ressources" className="flex max-h-64 flex-col border-b border-border lg:max-h-none lg:w-96 lg:border-b-0 lg:border-r">
          <div role="tablist" className="flex gap-6 border-b border-border px-5">
            {TABS.map((t, i) => (
              <button key={t} role="tab" aria-selected={i === 0} disabled={i > 0} title={i > 0 ? "Bientôt" : undefined}
                className={cn("py-3 text-nav uppercase", i === 0 ? "text-text" : "text-text-subtle")}>{t}</button>
            ))}
          </div>
          <div className="flex gap-4 border-b border-border px-5 py-2 text-base">
            <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={filter === "all" ? "text-text" : "text-text-muted"}>Tout {(canvas.value?.nodes ?? []).filter((n) => n.data.mediaUrl).length}</button>
            <button onClick={() => setFilter("fav")} aria-pressed={filter === "fav"} className={filter === "fav" ? "text-text" : "text-text-muted"}>Favoris {(canvas.value?.nodes ?? []).filter((n) => n.data.favorite).length}</button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {groups.length === 0 && <p className="px-5 py-6 text-sm text-text-muted">{filter === "fav" ? "Aucun favori. Ajoutez-en depuis la toile (cœur)." : "Aucun plan généré pour l'instant."}</p>}
            {groups.map((g) => (
              <div key={g.id} className="mb-2">
                <p className="flex items-center gap-2 px-5 py-2 text-base text-text-muted"><ChevronDown aria-hidden className="size-4" /><span className="truncate" title={g.name}>{g.name}</span><span className="ml-auto">{g.items.length}</span></p>
                <ul>
                  {g.items.map((n) => (
                    <li key={n.id} className="group flex items-center gap-3 px-5 py-1.5 hover:bg-surface-sunken">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.data.posterUrl ?? n.data.mediaUrl} alt="" className="size-12 shrink-0 object-cover" />
                      <span className="min-w-0 flex-1 truncate" title={n.name}>{n.name}</span>
                      {n.data.favorite && <Heart aria-label="Favori" className="size-4 fill-current text-text-muted" />}
                      {n.type === "video" && <span className="text-sm text-text-muted">{((n.data.durationMs ?? 0) / 1000).toFixed(0)} s</span>}
                      <IconButton label={`Ajouter ${n.name} au montage`} className="size-8" icon={<Plus className="size-4" />} onClick={() => add(n)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Aperçu */}
        <section aria-label="Aperçu" className="flex min-h-56 flex-1 items-center justify-center bg-bg p-4">
          {tl.main.length === 0 ? (
            <div className="max-w-sm text-center">
              <p className="text-xl">Montez vos plans en film</p>
              <Button className="mt-5" loading={busy} onClick={letAgentBuild}><Sparkles aria-hidden className="size-4" />Laisser l&apos;agent monter le film</Button>
              <p className="mt-3 text-sm text-text-muted">ou ajoutez des plans avec + dans les ressources</p>
            </div>
          ) : (
            <div className="relative aspect-video max-h-full w-full max-w-3xl overflow-hidden bg-primary">
              {current?.data.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.data.posterUrl ?? current.data.mediaUrl} alt={current.name} className="absolute inset-0 size-full object-cover"
                  style={current.type === "video" && hit ? { transform: `scale(${1 + 0.12 * hit.progress}) translateX(${-3 * hit.progress}%)` } : undefined} />
              )}
              {tl.text.filter((t) => playhead >= t.startMs && playhead < t.startMs + t.durationMs).map((t) => (
                <p key={t.id} className="absolute bottom-[8%] left-1/2 -translate-x-1/2 bg-primary/55 px-4 py-1 text-xl text-on-primary">{t.text}</p>
              ))}
            </div>
          )}
        </section>

        {/* Propriétés */}
        <section aria-label="Propriétés du clip" className="hidden w-80 border-l border-border p-5 lg:block">
          {sel ? (
            <div className="space-y-5">
              <p className="truncate text-lg" title={nodes.get(sel.nodeId)?.name}>{nodes.get(sel.nodeId)?.name ?? "Plan supprimé de la toile"}</p>
              <label className="block">
                <span className="text-sm text-text-muted">Durée (secondes)</span>
                <input type="number" min={MIN_CLIP_MS / 1000} max={60} step={0.1} value={(sel.durationMs / 1000).toFixed(1)}
                  onChange={(e) => { const v = Math.round(Number(e.target.value) * 1000); if (v >= MIN_CLIP_MS) commit(tl.main.map((c) => (c.id === sel.id ? { ...c, durationMs: v } : c))); }}
                  className="mt-1 h-10 w-full border border-border-input px-3 outline-none focus:border-text" />
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={selIndex <= 0} onClick={() => commit(move(tl.main, selIndex, selIndex - 1))}><ArrowLeft aria-hidden className="size-4" />Avant</Button>
                <Button variant="secondary" size="sm" disabled={selIndex >= tl.main.length - 1} onClick={() => commit(move(tl.main, selIndex, selIndex + 1))}>Après<ArrowRight aria-hidden className="size-4" /></Button>
              </div>
              <Button variant="danger" size="sm" onClick={() => remove(sel.id)}><Trash2 aria-hidden className="size-4" />Retirer du montage</Button>
            </div>
          ) : (
            <p className="pt-10 text-center text-text-muted">Sélectionnez un clip pour voir ses propriétés</p>
          )}
        </section>
      </div>

      {/* Barre de timeline */}
      <div role="toolbar" aria-label="Outils du montage" className="flex flex-wrap items-center gap-1 border-y border-border px-3 py-1">
        <IconButton label="Dézoomer" icon={<ZoomOut className="size-5" />} onClick={() => setPxPerSec((v) => Math.max(20, v / 1.5))} />
        <IconButton label="Zoomer" icon={<ZoomIn className="size-5" />} onClick={() => setPxPerSec((v) => Math.min(400, v * 1.5))} />
        <span className="px-2 text-sm text-text-muted">{project.aspectRatio} · {tl.fps} i/s</span>
        <div className="mx-auto flex items-center gap-2">
          <IconButton label={playing ? "Pause (Espace)" : "Lire (Espace)"} disabled={!total}
            icon={playing ? <Pause className="size-5" /> : <Play className="size-5" />}
            onClick={() => { if (playhead >= total) setPlayhead(0); setPlaying((p) => !p); }} />
          <span className="tabular-nums" aria-label="Position">{timecode(playhead)} / {timecode(total)}</span>
          <IconButton label="Plein écran (bientôt)" aria-disabled icon={<Maximize2 className="size-5" />} />
        </div>
        <IconButton label="Couper sous la tête de lecture" shortcut="S" disabled={!hit} icon={<Scissors className="size-5" />} onClick={split} />
        <IconButton label="Retirer le clip sélectionné" shortcut="Suppr" disabled={!selected} icon={<Trash2 className="size-5" />} onClick={() => selected && remove(selected)} />
        <IconButton label="Ajouter un texte" shortcut="T" disabled={!total}
          icon={<Type className="size-5" />}
          onClick={() => { const t = window.prompt("Texte à afficher"); if (t?.trim()) commit(tl.main, [...tl.text, { id: crypto.randomUUID(), text: t.trim(), startMs: playhead, durationMs: 2500 }]); }} />
        <Button size="sm" variant="secondary" className="ml-2" disabled={!total} onClick={() => setExporting(true)}><Upload aria-hidden className="size-4" />Exporter</Button>
      </div>

      {/* Timeline */}
      <div className="h-44 overflow-x-auto" aria-label="Timeline">
        <div style={{ width }} className="relative h-full">
          <div className="relative h-7 cursor-pointer border-b border-border"
            onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPlayhead(Math.max(0, Math.min(total, ((e.clientX - r.left - 96) / pxPerSec) * 1000))); }}>
            {Array.from({ length: Math.ceil(width / pxPerSec) }, (_, i) => (
              <span key={i} className="absolute top-1 whitespace-nowrap text-xs text-text-muted" style={{ left: 96 + i * pxPerSec }}>{i} s</span>
            ))}
          </div>
          <div className="flex h-20 items-center">
            <span className="w-24 shrink-0 px-3 text-sm text-text-muted">Principale</span>
            <ol className="flex h-16" aria-label="Clips de la piste principale">
              {tl.main.map((c, i) => {
                const n = nodes.get(c.nodeId);
                return (
                  <li key={c.id} style={{ width: (c.durationMs / 1000) * pxPerSec }}
                    draggable onDragStart={() => (dragFrom.current = i)} onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragFrom.current !== null && dragFrom.current !== i) commit(move(tl.main, dragFrom.current, i)); dragFrom.current = null; }}>
                    <button onClick={() => { setSelected(c.id); setPlayhead(s[i]); }} aria-pressed={selected === c.id}
                      title={`${n?.name ?? "Plan manquant"} · ${(c.durationMs / 1000).toFixed(1)} s`}
                      className={cn("relative h-full w-full overflow-hidden border-2 bg-surface-sunken text-left", selected === c.id ? "border-accent" : "border-surface")}>
                      {n?.data.mediaUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.data.posterUrl ?? n.data.mediaUrl} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
                      )}
                      <span className="absolute bottom-0 left-0 max-w-full truncate bg-primary/60 px-1 text-xs text-on-primary">{n?.name ?? "Plan manquant"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="flex h-10 items-center">
            <span className="w-24 shrink-0 px-3 text-sm text-text-muted">Texte</span>
            <div className="relative h-7 flex-1">
              {tl.text.map((t) => (
                <button key={t.id} title={t.text} onClick={() => setPlayhead(t.startMs)}
                  onDoubleClick={() => commit(tl.main, tl.text.filter((x) => x.id !== t.id))}
                  style={{ left: (t.startMs / 1000) * pxPerSec, width: (t.durationMs / 1000) * pxPerSec }}
                  className="absolute h-full truncate bg-highlight px-1 text-left text-xs">{t.text}</button>
              ))}
            </div>
          </div>
          <div aria-hidden className="pointer-events-none absolute top-0 h-full w-px bg-accent" style={{ left: 96 + (playhead / 1000) * pxPerSec }}>
            <span className="absolute -left-1.5 top-0 size-3 rounded-pill bg-accent" />
          </div>
        </div>
      </div>

      {notice && (
        <div role="status" className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 border border-border bg-surface px-4 py-3 shadow-pop">
          <span>{notice}</span><button onClick={() => setNotice(null)} className="text-sm text-text-muted underline">Fermer</button>
        </div>
      )}
      <ExportDialog open={exporting} onOpenChange={setExporting} project={project} timeline={tl} nodes={nodes} />
    </div>
  );
}
