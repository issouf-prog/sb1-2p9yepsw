"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play, Pause, ZoomIn, ZoomOut, Scissors, Trash2, Upload, Sparkles, ArrowLeft, ArrowRight, Type, Maximize2, Captions,
} from "lucide-react";
import { data, ConflictError, type AudioClip, type CanvasNode, type Project, type Timeline, type TimelineClip } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { buildTimeline } from "@/lib/agent/tools";
import {
  clipAt, defaultDuration, move, splitAt, starts, timecode, totalMs, MIN_CLIP_MS,
  TRANSITIONS, TRANSITION_LABEL, DEFAULT_TRANSITION_MS, transitionAt, subtitlesFrom, type Layer,
} from "@/lib/timeline";
import type { TransitionKind } from "@/lib/data";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ExportDialog } from "./export-dialog";
import { ResourceList } from "@/components/app/resource-list";
import { useApp } from "@/components/app/app-context";

const TABS = ["Ressources", "Sons", "Effets", "Transitions"] as const;
const READY: (typeof TABS)[number][] = ["Ressources", "Transitions"];

/** Style CSS d'une couche d'aperçu pendant une transition. */
const layerStyle = (l: Layer): React.CSSProperties => ({
  opacity: l.opacity, transform: l.x ? `translateX(${l.x * 100}%)` : undefined, clipPath: l.reveal < 1 ? `inset(0 ${(1 - l.reveal) * 100}% 0 0)` : undefined,
});

export function EditorView({ project }: { project: Project }) {
  const { ask } = useApp();
  const canvas = useLive(() => data.canvas(project.id), [project.id], project.id);
  const remote = useLive(() => data.timeline(project.id), [project.id], project.id);
  const [tl, setTl] = useState<Timeline | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pxPerSec, setPxPerSec] = useState(80);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Ressources");
  const dragFrom = useRef<number | null>(null);

  useEffect(() => { if (remote.value) setTl(remote.value); }, [remote.value]);

  const nodes = useMemo(() => new Map((canvas.value?.nodes ?? []).map((n) => [n.id, n])), [canvas.value]);
  const sections = canvas.value?.sections ?? [];
  const audioClips: AudioClip[] = useMemo(() => tl?.audio ?? [], [tl?.audio]);
  const audioEls = useRef(new Map<string, HTMLAudioElement>());
  const total = tl ? totalMs(tl) : 0;

  const commit = useCallback(async (main: TimelineClip[], text = tl?.text ?? [], audio = tl?.audio ?? []) => {
    if (!tl) return;
    const optimistic = { ...tl, main, text, audio };
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

  const add = (n: CanvasNode) => {
    if (!tl) return;
    if (n.type === "audio") {
      const kind = n.data.action === "generate_music" ? ("music" as const) : ("voice" as const);
      return commit(tl.main, tl.text, [...audioClips, { id: crypto.randomUUID(), nodeId: n.id, kind, startMs: kind === "music" ? 0 : Math.min(playhead, Math.max(0, total - 500)), durationMs: n.data.durationMs ?? 3000, volume: kind === "music" ? 0.6 : 1 }]);
    }
    return commit([...tl.main, { id: crypto.randomUUID(), nodeId: n.id, durationMs: defaultDuration(n) }]);
  };

  // Son synchronisé avec la tête de lecture.
  useEffect(() => {
    for (const c of audioClips) {
      const el = audioEls.current.get(c.id);
      if (!el) continue;
      const inside = playhead >= c.startMs && playhead < c.startMs + c.durationMs;
      el.volume = c.volume;
      if (playing && inside) {
        const want = (playhead - c.startMs) / 1000;
        if (Math.abs(el.currentTime - want) > 0.3) el.currentTime = want;
        if (el.paused) el.play().catch(() => {});
      } else if (!el.paused) el.pause();
    }
  }, [playhead, playing, audioClips]);
  const remove = (id: string) => tl && (commit(tl.main.filter((c) => c.id !== id)), setSelected(null));
  const split = () => tl && commit(splitAt(tl.main, playhead));
  const sel = tl?.main.find((c) => c.id === selected) ?? null;
  const selIndex = sel && tl ? tl.main.indexOf(sel) : -1;

  const setTransition = (ids: string[], kind: TransitionKind | null, durationMs = DEFAULT_TRANSITION_MS) => {
    if (!tl) return;
    commit(tl.main.map((c, i) => (ids.includes(c.id) && i > 0 ? { ...c, transition: kind ? { kind, durationMs } : undefined } : c)));
  };
  const applyTransition = (kind: TransitionKind | null) => {
    if (!tl) return;
    if (!sel) return setNotice("Sélectionnez d'abord un clip de la piste principale, ou appliquez la transition à tous les raccords.");
    if (selIndex === 0) return setNotice("Le premier clip n'a pas de plan avant lui : choisissez un clip suivant.");
    setTransition([sel.id], kind, sel.transition?.durationMs);
    setNotice(kind ? `${TRANSITION_LABEL[kind]} avant « ${nodes.get(sel.nodeId)?.name ?? "ce clip"} ».` : "Coupe franche rétablie.");
  };

  const autoSubtitles = () => {
    if (!tl) return;
    const subs = subtitlesFrom(audioClips, (id) => nodes.get(id)?.data.prompt);
    if (!subs.length) return setNotice("Aucune voix off dans le montage : ajoutez-en une (ou demandez-la à l'agent), puis générez les sous-titres.");
    commit(tl.main, [...tl.text.filter((x) => x.kind !== "subtitle"), ...subs]);
    setNotice(`${subs.length} sous-titres générés depuis la voix off.`);
  };

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
  const trans = transitionAt(tl.main, Math.min(playhead, Math.max(0, total - 1)));
  const prevNode = trans ? nodes.get(trans.prev.nodeId) : null;
  const s = starts(tl.main);
  const width = Math.max(800, (total / 1000) * pxPerSec + 200);

  return (
    <div className="flex h-full flex-col bg-surface" onKeyDown={onKey}>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Ressources */}
        <section aria-label="Ressources" data-tour="editor-resources" className="flex max-h-64 flex-col border-b border-border lg:max-h-none lg:w-96 lg:border-b-0 lg:border-r">
          <div role="tablist" aria-label="Panneau du montage" className="flex gap-x-3 overflow-x-auto border-b border-border px-3">
            {TABS.map((t) => {
              const ready = READY.includes(t);
              return (
                <button key={t} role="tab" id={`tab-${t}`} aria-controls="editor-tabpanel" aria-selected={tab === t} disabled={!ready} title={ready ? undefined : "Bientôt"}
                  onClick={() => setTab(t)}
                  className={cn("shrink-0 py-3 text-nav uppercase tracking-[0.04em]", tab === t ? "text-text" : ready ? "text-text-muted hover:text-text" : "text-text-subtle")}>{t}</button>
              );
            })}
          </div>
          <div id="editor-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col">
            {tab === "Ressources" ? (
              <ResourceList nodes={canvas.value?.nodes ?? []} sections={sections} onAdd={add} />
            ) : (
              <div className="space-y-2 overflow-y-auto p-4">
                <p className="text-sm text-text-muted">
                  {sel && selIndex > 0 ? <>Transition avant <strong className="text-text">{nodes.get(sel.nodeId)?.name}</strong></> : "Sélectionnez un clip (pas le premier) pour choisir la transition qui l'amène."}
                </p>
                {TRANSITIONS.map((tr) => (
                  <button key={tr.kind} onClick={() => applyTransition(tr.kind)} aria-pressed={sel?.transition?.kind === tr.kind}
                    className={cn("block w-full border px-4 py-3 text-left hover:border-text", sel?.transition?.kind === tr.kind ? "border-text bg-surface-sunken" : "border-border")}>
                    <span className="block">{tr.label}</span>
                    <span className="block text-sm text-text-muted">{tr.desc}</span>
                  </button>
                ))}
                <button onClick={() => applyTransition(null)} aria-pressed={!!sel && !sel.transition}
                  className="block w-full border border-border px-4 py-3 text-left hover:border-text">Coupe franche (aucune)</button>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="secondary" disabled={tl.main.length < 2} onClick={() => { setTransition(tl.main.map((c) => c.id), "dissolve"); setNotice(`Fondu enchaîné sur ${tl.main.length - 1} raccord${tl.main.length > 2 ? "s" : ""}.`); }}>Fondu enchaîné partout</Button>
                  <Button size="sm" variant="ghost" disabled={!tl.main.some((c) => c.transition)} onClick={() => { setTransition(tl.main.map((c) => c.id), null); setNotice("Toutes les transitions retirées."); }}>Tout retirer</Button>
                </div>
              </div>
            )}
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
            <div className="relative max-h-full w-full max-w-3xl overflow-hidden bg-primary" style={{ aspectRatio: project.aspectRatio.replace(":", " / ") }}>
              {trans && prevNode?.data.mediaUrl && (
                <div className="absolute inset-0" style={layerStyle(trans.layers.prev)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prevNode.data.posterUrl ?? prevNode.data.mediaUrl} alt="" className="size-full object-cover" />
                </div>
              )}
              {current?.data.mediaUrl && (
                <div className="absolute inset-0" style={trans ? layerStyle(trans.layers.next) : undefined} data-transition={trans?.kind}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.data.posterUrl ?? current.data.mediaUrl} alt={current.name} className="size-full object-cover"
                    style={current.type === "video" && hit ? { transform: `scale(${1 + 0.12 * hit.progress}) translateX(${-3 * hit.progress}%)` } : undefined} />
                </div>
              )}
              {tl.text.filter((t) => playhead >= t.startMs && playhead < t.startMs + t.durationMs).map((t) => (
                <p key={t.id} className={cn("absolute left-1/2 max-w-[90%] -translate-x-1/2 text-center text-on-primary",
                  t.kind === "subtitle" ? "bottom-[4%] bg-primary/70 px-3 py-0.5 text-base" : "bottom-[14%] bg-primary/55 px-4 py-1 text-xl")}>{t.text}</p>
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
              {selIndex > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-sm text-text-muted">Transition d&apos;entrée</span>
                    <select value={sel.transition?.kind ?? ""} onChange={(e) => setTransition([sel.id], (e.target.value || null) as TransitionKind | null, sel.transition?.durationMs)}
                      className="mt-1 h-10 w-full border border-border-input bg-surface px-2 outline-none focus:border-text">
                      <option value="">Coupe franche</option>
                      {TRANSITIONS.map((tr) => <option key={tr.kind} value={tr.kind}>{tr.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-text-muted">Durée (s)</span>
                    <input type="number" min={0.2} max={2} step={0.1} disabled={!sel.transition} value={((sel.transition?.durationMs ?? DEFAULT_TRANSITION_MS) / 1000).toFixed(1)}
                      onChange={(e) => { const v = Math.round(Number(e.target.value) * 1000); if (sel.transition && v >= 200 && v <= 2000) setTransition([sel.id], sel.transition.kind, v); }}
                      className="mt-1 h-10 w-full border border-border-input px-3 outline-none focus:border-text disabled:opacity-45" />
                  </label>
                </div>
              )}
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
        <label className="sr-only" htmlFor="tl-ratio">Format du film</label>
        <select id="tl-ratio" value={project.aspectRatio} onChange={(e) => data.updateProject(project.id, { aspectRatio: e.target.value as Project["aspectRatio"] })}
          className="h-8 border border-border bg-surface px-1 text-sm text-text-muted">
          {["16:9", "9:16", "1:1", "21:9", "4:3", "3:4", "5:4"].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <label className="sr-only" htmlFor="tl-fps">Images par seconde</label>
        <select id="tl-fps" value={tl.fps} onChange={async (e) => { const fps = Number(e.target.value) as Timeline["fps"]; try { setTl(await data.saveTimeline({ ...tl, fps })); } catch { setTl(await data.timeline(project.id)); } }}
          className="h-8 border border-border bg-surface px-1 text-sm text-text-muted">
          {[24, 25, 30].map((f) => <option key={f} value={f}>{f} i/s</option>)}
        </select>
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
          onClick={async () => { const t = await ask({ title: "Ajouter un texte", label: "Texte affiché à la tête de lecture (2,5 s)", confirm: "Ajouter", multiline: true }); if (t) commit(tl.main, [...tl.text, { id: crypto.randomUUID(), text: t, startMs: playhead, durationMs: 2500 }]); }} />
        <IconButton label="Sous-titres automatiques (depuis la voix off)" disabled={!total} icon={<Captions className="size-5" />} onClick={autoSubtitles} />
        <Button size="sm" variant="secondary" className="ml-2" data-tour="export" disabled={!total} onClick={() => setExporting(true)}><Upload aria-hidden className="size-4" />Exporter</Button>
      </div>

      {/* Timeline */}
      <div className="h-52 overflow-x-auto" aria-label="Timeline">
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
                      {c.transition && i > 0 && (
                        <span title={`${TRANSITION_LABEL[c.transition.kind]} · ${(c.transition.durationMs / 1000).toFixed(1)} s`} aria-label={`Transition : ${TRANSITION_LABEL[c.transition.kind]}`}
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent/70 to-transparent" style={{ width: Math.min((c.transition.durationMs / 1000) * pxPerSec, (c.durationMs / 2000) * pxPerSec) }} />
                      )}
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
                  aria-label={`${t.kind === "subtitle" ? "Sous-titre" : "Texte"} : ${t.text}`}
                  className={cn("absolute h-full truncate border-r border-surface px-1 text-left text-xs", t.kind === "subtitle" ? "bg-surface-sunken" : "bg-highlight")}>{t.text}</button>
              ))}
            </div>
          </div>
          <div className="flex h-10 items-center">
            <span className="w-24 shrink-0 px-3 text-sm text-text-muted">Son</span>
            <div className="relative h-7 flex-1">
              {audioClips.map((c) => {
                const n = nodes.get(c.nodeId);
                return (
                  <button key={c.id} title={`${n?.name ?? "Son"} · ${(c.durationMs / 1000).toFixed(1)} s · double-clic pour retirer`}
                    onClick={() => setPlayhead(c.startMs)}
                    onDoubleClick={() => commit(tl.main, tl.text, audioClips.filter((x) => x.id !== c.id))}
                    style={{ left: (c.startMs / 1000) * pxPerSec, width: (c.durationMs / 1000) * pxPerSec }}
                    className={cn("absolute h-full truncate px-1 text-left text-xs", c.kind === "music" ? "bg-section" : "bg-surface-sunken")}>
                    {c.kind === "music" ? "♪ " : ""}{n?.name ?? "Son"}
                  </button>
                );
              })}
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
      {audioClips.map((c) => {
        const n = nodes.get(c.nodeId);
        return n?.data.mediaUrl ? (
          <audio key={c.id} src={n.data.mediaUrl} preload="auto" ref={(el) => { if (el) audioEls.current.set(c.id, el); else audioEls.current.delete(c.id); }} />
        ) : null;
      })}
      <ExportDialog open={exporting} onOpenChange={setExporting} project={project} timeline={tl} nodes={nodes} />
    </div>
  );
}
