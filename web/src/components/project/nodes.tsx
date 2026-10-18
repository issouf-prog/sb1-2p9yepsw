"use client";

import { Handle, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  Heart, Pencil, Download, Maximize2, CopyPlus, Trash2, Copy, RefreshCw, Video, Film, Play, Loader2, AlertCircle, ChevronDown, ImageIcon, Check, X,
  UserRound, Mic, Music, Archive, Wand2, ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { mediaSize } from "@/lib/canvas";
import { MODELS, VOICES, AUTO, VIDEO_SECONDS, VIDEO_RESOLUTIONS, BATCH_SIZES, PLAN_LABEL, lockedFor, priceOf, type ModelKind, type VideoResolution } from "@/lib/data/prices";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import type { CanvasNode, Section } from "@/lib/data";
import { useCanvasActions } from "./canvas-actions";

export type SectionRF = Node<{ section: Section }, "section">;
export type MediaRF = Node<{ node: CanvasNode }, "media">;
export type NoteRF = Node<{ node: CanvasNode }, "note">;

/** Poignée de connexion : discrète, visible au survol du nœud ; tirer de la droite d'un plan vers la gauche d'un générateur. */
const hidden = "!size-3 !min-h-0 !min-w-0 !border-2 !border-surface !bg-border-input opacity-0 transition-opacity group-hover/node:opacity-100";

export function SectionNode({ data }: NodeProps<SectionRF>) {
  const { toggleSection, dissolveSection } = useCanvasActions();
  const s = data.section;
  return (
    <div className="group/section size-full">
      <button onClick={() => dissolveSection(s.id)} title="Retirer la section (les plans restent sur la toile)" aria-label={`Retirer la section ${s.name}`}
        className="nodrag absolute -top-12 right-0 rounded-pill p-2 text-text-muted opacity-0 hover:bg-surface-sunken hover:text-text focus:opacity-100 group-hover/section:opacity-100">
        <X className="size-4" />
      </button>
      <button
        onClick={() => toggleSection(s.id)}
        aria-expanded={!s.collapsed}
        title={s.name}
        className="nodrag absolute -top-14 left-0 inline-flex max-w-full items-center gap-2 border border-border bg-surface px-4 py-2 text-lg hover:border-border-input"
      >
        <ChevronDown aria-hidden className={cn("size-5 transition-transform duration-fast", s.collapsed && "-rotate-90")} />
        <span className="truncate">{s.name}</span>
      </button>
      {!s.collapsed && <div className="size-full bg-section" />}
    </div>
  );
}

function MenuRow({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button role="menuitem" disabled={disabled} onClick={onClick}
      className="flex h-10 w-full items-center gap-3 px-4 text-left text-base hover:bg-surface-sunken disabled:opacity-40 [&>svg]:size-5 [&>svg]:text-text-muted">
      {icon}
      {label}
    </button>
  );
}

export function MediaNode({ data, selected }: NodeProps<MediaRF>) {
  const actions = useCanvasActions();
  const n = data.node;
  const { w, h } = mediaSize(actions.ratio);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const status = n.data.status ?? "done";

  if (n.type === "generator") return <GeneratorNode node={n} selected={!!selected} w={w} h={h} />;
  if (n.type === "audio") return <AudioNode node={n} selected={!!selected} />;

  const isVideo = n.type === "video";
  return (
    <div style={{ width: w }} className={cn("group/node border bg-surface", selected ? "border-text" : "border-border")}>
      <Handle type="target" position={Position.Left} className={hidden} />
      <Handle type="source" position={Position.Right} className={hidden} />

      <NodeToolbar isVisible={selected} position={Position.Top} align="start" offset={8}>
        <div role="toolbar" aria-label={`Actions sur ${n.name}`} className="flex items-center gap-0.5 border border-border bg-surface px-1 shadow-toolbar">
          <IconButton label={n.data.favorite ? "Retirer des favoris" : "Ajouter aux favoris"} active={n.data.favorite} className="size-8"
            icon={<Heart className={cn("size-4", n.data.favorite && "fill-current")} />}
            onClick={() => actions.update({ ...n, data: { ...n.data, favorite: !n.data.favorite } })} />
          <span className="mx-1 max-w-52 truncate text-base" title={n.name}>{n.name}</span>
          <IconButton label="Renommer" className="size-8" icon={<Pencil className="size-4 text-text-muted" />}
            onClick={() => actions.rename(n)} />
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <a href={n.data.mediaUrl} download={`${n.name}.${isVideo ? "svg" : "svg"}`} aria-label="Télécharger" title="Télécharger"
            className="inline-flex size-8 items-center justify-center rounded-pill hover:bg-surface-sunken"><Download className="size-4" /></a>
          <IconButton label="Plein écran" className="size-8" icon={<Maximize2 className="size-4" />} onClick={() => actions.preview(n)} />
          <IconButton label="Dupliquer" className="size-8" icon={<CopyPlus className="size-4" />} onClick={() => actions.duplicate(n)} />
          <IconButton label="Archiver (retirer de la toile)" className="size-8" icon={<Archive className="size-4" />} onClick={() => actions.archive(n)} />
        </div>
      </NodeToolbar>

      <NodeToolbar isVisible={selected} position={Position.Right} align="start" offset={8}>
        <div role="menu" aria-label={`Menu de ${n.name}`} className="w-60 border border-border bg-surface py-2 shadow-pop">
          <MenuRow icon={<RefreshCw />} label="Relancer" onClick={() => actions.regenerate(n)} disabled={!n.data.prompt || isVideo} />
          <div className="mx-4 my-2 h-px bg-border" />
          {!isVideo && <MenuRow icon={<Video />} label="Animer cette image" onClick={() => actions.animate(n)} />}
          {!isVideo && <MenuRow icon={<Wand2 />} label="Modifier l'image" onClick={() => actions.editFrom(n)} />}
          {!isVideo && <MenuRow icon={<UserRound />} label="Personnage de référence" onClick={() => actions.characterFrom(n)} />}
          <MenuRow icon={<Film />} label="Envoyer au montage" onClick={() => actions.sendToEditor(n)} />
          <div className="mx-4 my-2 h-px bg-border" />
          <MenuRow icon={<Trash2 />} label="Supprimer" onClick={() => actions.remove([n.id])} />
        </div>
      </NodeToolbar>

      <div className="relative overflow-hidden bg-surface-sunken" style={{ height: h }}>
        {isVideo && n.data.uploaded ? (
          <video src={n.data.mediaUrl} poster={n.data.posterUrl} controls muted className="nodrag size-full object-cover" aria-label={n.name} />
        ) : n.data.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={isVideo ? n.data.posterUrl : n.data.mediaUrl} alt={n.data.prompt ?? n.name} draggable={false}
            className={cn("size-full object-cover", playing && "animate-[kenburns_5s_ease-in-out_forwards]")}
            onAnimationEnd={() => setPlaying(false)} />
        )}
        {isVideo && !n.data.uploaded && (
          <button onClick={() => setPlaying(true)} aria-label={`Lire ${n.name}`}
            className="nodrag absolute inset-0 m-auto flex size-12 items-center justify-center rounded-pill bg-primary/60 text-on-primary hover:bg-primary/80">
            <Play className="size-5" />
          </button>
        )}
      </div>
      <p className="px-2 pt-1 text-right text-xs tabular-nums text-text-muted">
        {n.data.width && n.data.height ? `${n.data.width} × ${n.data.height} px` : ""}{isVideo && n.data.durationMs ? ` · ${(n.data.durationMs / 1000).toFixed(1)} s${n.data.uploaded ? "" : " · aperçu simulé"}` : ""}
        {n.data.uploaded && " · importé"}{n.data.styleName && ` · ${n.data.styleName}`}
        {status === "failed" && " · échec"}
      </p>
      {n.data.prompt && (
        <div className="px-2 pb-2">
          <div className="flex items-start gap-1">
            <p className={cn("flex-1 text-sm", !open && "line-clamp-3")}><mark className="bg-highlight text-text">{n.data.prompt}</mark></p>
            <IconButton label={copied ? "Copié" : "Copier le prompt"} className="nodrag size-7"
              icon={copied ? <Check className="size-4" /> : <Copy className="size-4 text-text-muted" />}
              onClick={() => { navigator.clipboard?.writeText(n.data.prompt!); setCopied(true); setTimeout(() => setCopied(false), 1200); }} />
          </div>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="nodrag mt-1 text-xs text-text-muted hover:text-text">
            {open ? "Voir moins" : "Voir tout"}
          </button>
        </div>
      )}
    </div>
  );
}

const KIND_OF: Record<string, ModelKind> = {
  generate_image: "image", generate_video: "video", character_ref: "character", generate_voice: "voice", generate_music: "music", edit_image: "edit",
};
const KIND_UI: Record<ModelKind, { title: string; icon: React.ReactNode; field: string; placeholder: string }> = {
  image: { title: "Nouvelle image", icon: <ImageIcon aria-hidden className="size-6 text-text-muted" />, field: "Prompt du plan", placeholder: "Décrivez le plan : sujet, cadrage, lumière…" },
  video: { title: "Image vers vidéo", icon: <Video aria-hidden className="size-6 text-text-muted" />, field: "Prompt du plan", placeholder: "Décrivez le mouvement" },
  character: { title: "Personnage dans une scène", icon: <UserRound aria-hidden className="size-6 text-text-muted" />, field: "Prompt du plan", placeholder: "Où est le personnage, que fait-il, cadrage…" },
  voice: { title: "Nouvelle voix", icon: <Mic aria-hidden className="size-6 text-text-muted" />, field: "Réplique", placeholder: "Le texte à dire. [chuchoté] ou [rire] pour diriger." },
  music: { title: "Nouvelle musique", icon: <Music aria-hidden className="size-6 text-text-muted" />, field: "Prompt du plan", placeholder: "Ambiance, instruments, tempo…" },
  edit: { title: "Modifier l'image", icon: <Wand2 aria-hidden className="size-6 text-text-muted" />, field: "Modification", placeholder: "Ce qu'il faut changer : la lumière, un objet, l'expression…" },
};

function GeneratorNode({ node, selected, w, h }: { node: CanvasNode; selected: boolean; w: number; h: number }) {
  const actions = useCanvasActions();
  const kind = KIND_OF[node.data.action ?? "generate_image"] ?? "image";
  const ui = KIND_UI[kind];
  const models = MODELS[kind] as readonly { id: string; label: string; credits: number }[];
  const [prompt, setPrompt] = useState(node.data.prompt ?? "");
  const [model, setModel] = useState(node.data.model ?? AUTO);
  const [voice, setVoice] = useState(node.data.voice ?? VOICES[0].id);
  const [seconds, setSeconds] = useState<number>(node.data.seconds ?? 5);
  const [resolution, setResolution] = useState<VideoResolution>(node.data.resolution ?? "720p");
  const [count, setCount] = useState<number>(node.data.count ?? 1);
  const [endFrame, setEndFrame] = useState("");
  const [scene, setScene] = useState("");
  const status = node.data.status ?? "idle";
  const batchable = kind === "image" || kind === "edit" || kind === "character";
  const cost = priceOf(kind, model, seconds, resolution, batchable ? count : 1);
  const linked = actions.linkedText(node.id);
  const canRun = !!(prompt.trim() || linked);
  const lock = lockedFor(kind, model, actions.plan);
  const others = actions.media.filter((m) => m.id !== node.id);
  const running = status === "running";
  const isAudio = kind === "voice" || kind === "music";
  const boxH = isAudio ? 120 : h;

  return (
    <div style={{ width: isAudio ? 280 : w }} className="group/node">
      <Handle type="target" position={Position.Left} className={hidden} />
      <Handle type="source" position={Position.Right} className={hidden} />
      <p className="mb-1 truncate text-sm text-text-muted" title={node.name}>{node.name}</p>
      <div style={{ height: boxH }} className={cn("flex flex-col items-center justify-center gap-2 border border-dashed bg-surface px-4 text-center", selected ? "border-text" : "border-border-input")}>
        {running ? (
          <>
            <Loader2 aria-hidden className="size-6 animate-spin text-text-muted" />
            <p className="text-sm">Génération en cours…</p>
          </>
        ) : status === "failed" || status === "flagged" ? (
          <>
            {status === "flagged" ? <ShieldAlert aria-hidden className="size-6 text-danger" /> : <AlertCircle aria-hidden className="size-6 text-danger" />}
            <p className="text-sm text-danger">{node.data.error ?? "La génération n'a pas abouti."}</p>
          </>
        ) : (
          <>
            {ui.icon}
            <p className="text-sm">{ui.title}</p>
            <p className="text-xs text-text-muted">{selected ? "Réglez puis lancez ci-dessous" : "Sélectionnez pour régler"}</p>
          </>
        )}
      </div>
      <NodeToolbar isVisible={selected && !running} position={Position.Bottom} align="start" offset={10}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (lock) return actions.upgrade();
            if (canRun) actions.runGenerator(node, {
              prompt: prompt.trim(), model, voice: kind === "voice" ? voice : undefined,
              seconds: kind === "video" ? seconds : undefined, resolution: kind === "video" ? resolution : undefined,
              endFrameId: endFrame || undefined, count: batchable ? count : 1, sceneId: scene || undefined,
            });
          }}
          className="nodrag w-[22rem] space-y-3 border border-border bg-surface p-3 shadow-pop"
        >
          <label className="block">
            <span className="text-xs text-text-muted">Modèle</span>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
              <option value={AUTO}>Auto (choisi pour vous)</option>
              {models.map((m) => {
                const l = lockedFor(kind, m.id, actions.plan);
                return <option key={m.id} value={m.id}>{l ? "🔒 " : ""}{m.label} · {m.credits} crédits{l ? ` · plan ${PLAN_LABEL[l]}` : ""}</option>;
              })}
            </select>
          </label>
          {kind === "video" && (
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-xs text-text-muted">Résolution</span>
                <select value={resolution} onChange={(e) => setResolution(e.target.value as VideoResolution)} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
                  {VIDEO_RESOLUTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">Durée</span>
                <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
                  {VIDEO_SECONDS.map((s) => <option key={s} value={s}>{s} s</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">Image de fin</span>
                <select value={endFrame} onChange={(e) => setEndFrame(e.target.value)} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
                  <option value="">Aucune</option>
                  {others.filter((m) => m.type === "image").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            </div>
          )}
          {kind === "voice" && (
            <label className="block">
              <span className="text-xs text-text-muted">Voix</span>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
                {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label} · {v.desc}</option>)}
              </select>
            </label>
          )}
          {kind === "character" && (
            <label className="block">
              <span className="text-xs text-text-muted">Scène de référence (facultatif)</span>
              <select value={scene} onChange={(e) => setScene(e.target.value)} className="mt-1 h-9 w-full border border-border-input bg-surface px-2 text-sm outline-none focus:border-text">
                <option value="">Aucune</option>
                {others.filter((m) => m.type === "image").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          )}
          {batchable && (
            <fieldset>
              <legend className="text-xs text-text-muted">Nombre de résultats</legend>
              <div className="mt-1 inline-flex border border-border-input">
                {BATCH_SIZES.map((n) => (
                  <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}
                    className={cn("h-8 w-10 text-sm", count === n ? "bg-primary text-on-primary" : "hover:bg-surface-sunken")}>{n}×</button>
                ))}
              </div>
            </fieldset>
          )}
          {linked && (
            <p className="border-l-2 border-border-input pl-2 text-xs text-text-muted">
              Note reliée : <span className="text-text">{linked.length > 120 ? `${linked.slice(0, 119)}…` : linked}</span>
            </p>
          )}
          <label className="block">
            <span className="text-xs text-text-muted">{ui.field}</span>
            <MentionTextarea value={prompt} onValueChange={setPrompt} nodes={others} rows={3} maxLength={2000}
              placeholder={`${ui.placeholder} (@ pour citer un plan)`}
              onEnter={() => (document.activeElement as HTMLTextAreaElement | null)?.form?.requestSubmit()}
              className="mt-1 block w-full resize-none border border-border-input bg-surface px-2 py-1.5 text-sm outline-none focus:border-text" />
          </label>
          <div className="flex items-center justify-between gap-2">
            {lock ? <span className="text-xs text-text-muted">Modèle réservé au plan {PLAN_LABEL[lock]}</span> : <span />}
            <Button type="submit" size="sm" cost={cost} locked={!!lock} disabled={!lock && !canRun}>Lancer</Button>
          </div>
        </form>
      </NodeToolbar>
    </div>
  );
}

/** Barres de forme d'onde déterministes (aperçu, pas une analyse du son). */
function Bars({ seed }: { seed: string }) {
  let h = 7;
  const bars = Array.from({ length: 40 }, () => ((h = (h * 9301 + 49297 + seed.length) % 233280) / 233280) * 0.8 + 0.2);
  return (
    <div aria-hidden className="flex h-10 items-center gap-[2px]">
      {bars.map((v, i) => <span key={i} className="w-1 bg-text-muted/60" style={{ height: `${v * 100}%` }} />)}
    </div>
  );
}

function AudioNode({ node, selected }: { node: CanvasNode; selected: boolean }) {
  const actions = useCanvasActions();
  const isVoice = node.data.action === "generate_voice";
  const voice = VOICES.find((v) => v.id === node.data.voice);
  return (
    <div className={cn("group/node w-[280px] border bg-surface p-3", selected ? "border-text" : "border-border")}>
      <Handle type="target" position={Position.Left} className={hidden} />
      <Handle type="source" position={Position.Right} className={hidden} />
      <NodeToolbar isVisible={selected} position={Position.Right} align="start" offset={12}>
        <div role="menu" aria-label={`Menu de ${node.name}`} className="w-60 border border-border bg-surface py-2 shadow-pop">
          <MenuRow icon={<Pencil />} label="Renommer" onClick={() => actions.rename(node)} />
          <MenuRow icon={<Archive />} label="Archiver" onClick={() => actions.archive(node)} />
          <MenuRow icon={<Film />} label="Envoyer au montage" onClick={() => actions.sendToEditor(node)} />
          <div className="mx-4 my-2 h-px bg-border" />
          <MenuRow icon={<Trash2 />} label="Supprimer" onClick={() => actions.remove([node.id])} />
        </div>
      </NodeToolbar>
      <p className="flex items-center gap-2 truncate text-base" title={node.name}>
        {isVoice ? <Mic aria-hidden className="size-4 shrink-0 text-text-muted" /> : <Music aria-hidden className="size-4 shrink-0 text-text-muted" />}
        <span className="truncate">{node.name}</span>
      </p>
      <Bars seed={node.id} />
      {node.data.mediaUrl && <audio controls src={node.data.mediaUrl} className="nodrag mt-1 h-8 w-full" aria-label={`Écouter ${node.name}`} />}
      <p className="mt-1 text-xs text-text-muted">
        {((node.data.durationMs ?? 0) / 1000).toFixed(1)} s{voice ? ` · ${voice.label}` : ""}{node.data.uploaded ? " · importé" : " · aperçu simulé"}
      </p>
      {node.data.prompt && <p className="mt-1 line-clamp-3 text-sm"><mark className="bg-highlight text-text">{node.data.prompt}</mark></p>}
    </div>
  );
}

export function NoteNode({ data, selected }: NodeProps<NoteRF>) {
  const { update } = useCanvasActions();
  const n = data.node;
  return (
    <div className={cn("group/node w-60 border bg-highlight/60 p-3", selected ? "border-text" : "border-border")}>
      <Handle type="source" position={Position.Right} className={hidden} />
      <label className="sr-only" htmlFor={`note-${n.id}`}>Note</label>
      <textarea id={`note-${n.id}`} defaultValue={n.data.prompt} rows={4} placeholder="Écrivez une note ou un prompt…"
        onBlur={(e) => e.target.value !== (n.data.prompt ?? "") && update({ ...n, data: { ...n.data, prompt: e.target.value } })}
        className="nodrag block w-full resize-none bg-transparent text-sm outline-none" />
    </div>
  );
}
