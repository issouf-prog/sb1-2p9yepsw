"use client";

import "@xyflow/react/dist/style.css";
import {
  ReactFlow, Background, BackgroundVariant, useNodesState, useEdgesState, useReactFlow, useViewport, useOnSelectionChange,
  type Edge, type Node, type NodeChange,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, MousePointer2, Hand, Type, Images, FileText, Clapperboard, Settings, Maximize, Upload, Image as ImageIcon, Video, Mic, Music, StickyNote, BoxSelect, X,
} from "lucide-react";
import { data, InsufficientCreditsError, type CanvasNode, type CanvasState, type Project } from "@/lib/data";
import { AUTO, DEFAULT_MODEL, priceOf, musicDurationMs, lockedFor, resolveModel, type ModelKind, type PlanId } from "@/lib/data/prices";
import { moderate, flaggedMessage } from "@/lib/moderation";
import { applyStyle } from "@/lib/data/styles";
import { mentionedNodes } from "@/components/ui/mention-textarea";
import { fileToNode } from "@/lib/upload";
import { useLive } from "@/hooks/use-live";
import { StylePicker } from "./style-picker";
import { gen } from "@/lib/gen";
import { mediaSize, GAP, SECTION_HEADER, CAPTION } from "@/lib/canvas";
import { appendToTimeline, appendAudio } from "@/lib/agent/tools";
import { titleFrom } from "@/lib/data/fake";
import { IconButton } from "@/components/ui/icon-button";
import { VerticalToolbar, ToolbarDivider } from "@/components/ui/canvas-bits";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSub, MenuSubTrigger, MenuSubContent } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/dialog";
import { useApp } from "@/components/app/app-context";
import { CanvasActionsContext, type CanvasActions } from "./canvas-actions";
import { SectionNode, MediaNode, NoteNode } from "./nodes";
import { ResourceList } from "@/components/app/resource-list";

const nodeTypes = { section: SectionNode, media: MediaNode, note: NoteNode };

/** Presse-papiers de la toile (copier-coller de nœuds dans la même session). */
let clipboard: CanvasNode[] = [];

function toFlow(state: CanvasState, selected: Set<string>): Node[] {
  const collapsed = new Set(state.sections.filter((s) => s.collapsed).map((s) => s.id));
  const sections: Node[] = state.sections.map((s) => ({
    id: s.id, type: "section", position: { x: s.x, y: s.y }, data: { section: s },
    style: { width: s.w, height: s.collapsed ? 1 : s.h }, selectable: false, draggable: !s.locked,
  }));
  const nodes: Node[] = state.nodes.filter((n) => !n.data.archived).map((n) => ({
    id: n.id,
    type: n.type === "text" ? "note" : "media",
    position: { x: n.x, y: n.y },
    data: { node: n },
    ...(n.sectionId ? { parentId: n.sectionId } : {}),
    hidden: !!n.sectionId && collapsed.has(n.sectionId),
    selected: selected.has(n.id),
    ariaLabel: `${n.name}${n.data.status === "running" ? ", génération en cours" : ""}`,
  }));
  return [...sections, ...nodes];
}

function toEdges(state: CanvasState): Edge[] {
  return state.edges.map((e) => ({ id: e.id, source: e.from, target: e.to, type: "default", selectable: false }));
}

export function Canvas({ project, state, onSelectionChange }: { project: Project; state: CanvasState; onSelectionChange: (ids: string[]) => void }) {
  const { openTopUp, ask } = useApp();
  const router = useRouter();
  const flow = useReactFlow();
  const { zoom } = useViewport();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [hand, setHand] = useState(false);
  const [preview, setPreview] = useState<CanvasNode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const ws = useLive(() => data.workspace(), []);
  const styles = useLive(() => data.listStyles(), []);
  const plan: PlanId = ws.value?.plan ?? "free";
  const style = styles.value?.find((s) => s.id === project.styleId) ?? null;
  const fileInput = useRef<HTMLInputElement>(null);

  const importFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    const p = centerPoint();
    const errors: string[] = [];
    let i = 0;
    for (const f of list) {
      const r = await fileToNode(f);
      if (!r.ok) { errors.push(r.error); continue; }
      await data.upsertNode({ ...r.node, projectId: project.id, sectionId: null, x: p.x + i * 60, y: p.y + i * 60 });
      i++;
    }
    setNotice(errors.length ? errors.join(" ") : `${i} fichier${i > 1 ? "s importés" : " importé"}.`);
  };

  useEffect(() => {
    setNodes(toFlow(state, selected));
    setEdges(toEdges(state));
    // la sélection est gérée par React Flow ; on ne resynchronise qu'à chaque changement de données
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, setNodes, setEdges]);

  useOnSelectionChange({
    onChange: useCallback(({ nodes: sel }: { nodes: Node[] }) => {
      const ids = sel.map((n) => n.id);
      setSelected(new Set(ids));
      onSelectionChange(ids);
    }, [onSelectionChange]),
  });

  const byId = useMemo(() => new Map(state.nodes.map((n) => [n.id, n])), [state.nodes]);

  /** Centre de l'écran, décalé vers le bas jusqu'à une zone libre (ni plan ni section). */
  const centerPoint = () => {
    const el = document.querySelector(".react-flow") as HTMLElement | null;
    const r = el?.getBoundingClientRect();
    const c = flow.screenToFlowPosition({ x: (r?.left ?? 0) + (r?.width ?? 800) / 2 - 120, y: (r?.top ?? 0) + (r?.height ?? 600) / 2 - 160 });
    const { w, h } = mediaSize(project.aspectRatio);
    const boxes = [
      ...state.sections.map((s) => ({ x: s.x, y: s.y - SECTION_HEADER, w: s.w, h: s.h + SECTION_HEADER })),
      ...state.nodes.filter((n) => !n.sectionId && !n.data.archived).map((n) => ({ x: n.x, y: n.y, w, h: h + CAPTION })),
    ];
    const hits = (y: number) => boxes.find((b) => c.x < b.x + b.w && c.x + w > b.x && y < b.y + b.h && y + h + CAPTION > b.y);
    let y = c.y;
    for (let i = 0; i < 50; i++) {
      const b = hits(y);
      if (!b) break;
      y = b.y + b.h + GAP;
    }
    return { x: c.x, y };
  };

  type GenAction = NonNullable<CanvasNode["data"]["action"]>;
  const GEN_META: Record<GenAction, { name: string; kind: ModelKind }> = {
    generate_image: { name: "Nouvelle image", kind: "image" },
    generate_video: { name: "Image vers vidéo", kind: "video" },
    character_ref: { name: "Personnage dans une scène", kind: "character" },
    edit_image: { name: "Modifier l'image", kind: "edit" },
    generate_voice: { name: "Nouvelle voix", kind: "voice" },
    generate_music: { name: "Nouvelle musique", kind: "music" },
  };

  /** Première position libre (sans chevauchement) dans le même parent, en descendant. */
  const freePosition = async (sectionId: string | null, x: number, y: number) => {
    const { w, h } = mediaSize(project.aspectRatio);
    const step = h + CAPTION + GAP;
    const siblings = state.nodes.filter((n) => n.sectionId === sectionId && !n.data.archived);
    let py = y;
    while (siblings.some((n) => Math.abs(n.x - x) < w + 20 && Math.abs(n.y - py) < step - 20)) py += step;
    const section = sectionId ? state.sections.find((s) => s.id === sectionId) : null;
    if (section && (x + w + GAP > section.w || py + step > section.h)) {
      await data.upsertSection({ ...section, w: Math.max(section.w, x + w + GAP), h: Math.max(section.h, py + step) });
    }
    return { x, y: py };
  };

  const addGenerator = async (action: GenAction, from?: CanvasNode) => {
    const p = from ? await freePosition(from.sectionId, from.x + mediaSize(project.aspectRatio).w + 80, from.y) : centerPoint();
    const meta = GEN_META[action];
    const node: CanvasNode = {
      id: crypto.randomUUID(), projectId: project.id, sectionId: from?.sectionId ?? null, type: "generator",
      name: meta.name, x: p.x, y: p.y,
      data: { action, model: AUTO, status: "idle" },
    };
    await data.upsertNode(node);
    if (from) {
      const role = action === "character_ref" ? "character_ref" : action === "edit_image" ? "source" : "start_frame";
      await data.addEdge({ id: crypto.randomUUID(), projectId: project.id, from: from.id, to: node.id, role });
    }
    setNodes((ns) => ns.map((n) => ({ ...n, selected: false })));
    setTimeout(() => setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, selected: true } : n))), 0);
    return node;
  };

  const actions: CanvasActions = {
    ratio: project.aspectRatio,
    async runGenerator(node, { prompt, model, voice, seconds, endFrameId }) {
      const action = node.data.action ?? "generate_image";
      const kind = GEN_META[action].kind;
      // 1. Modération : refusé sans débit.
      const mod = moderate(prompt);
      if (!mod.ok) {
        await data.upsertNode({ ...node, data: { ...node.data, prompt, status: "flagged", error: flaggedMessage(mod.reason) } });
        return;
      }
      // 2. Plan : un modèle verrouillé ne se lance pas.
      if (lockedFor(kind, model, plan)) return actions.upgrade();
      const used = resolveModel(kind, model);
      const key = `gen:${node.id}:${Date.now()}`;
      const cost = priceOf(kind, model, seconds);
      try {
        await data.spend(cost, key);
      } catch (e) {
        if (e instanceof InsufficientCreditsError) {
          setNotice(`Il manque ${e.needed - e.available} crédits pour lancer ce plan. Rien n'a été débité.`);
          openTopUp();
          return;
        }
        throw e;
      }
      const visual = kind === "image" || kind === "video" || kind === "character" || kind === "edit";
      const styled = visual ? applyStyle(prompt, style) : prompt;
      const running = { ...node, data: { ...node.data, prompt, model, voice, seconds, styleName: visual ? style?.name : undefined, status: "running" as const, error: undefined } };
      await data.upsertNode(running);
      const sources = (role: string) => state.edges.filter((e) => e.to === node.id && e.role === role).map((e) => byId.get(e.from)).filter((n): n is CanvasNode => !!n?.data.mediaUrl);
      const cited = mentionedNodes(prompt, state.nodes).filter((n) => n.type === "image" && n.data.mediaUrl);
      // Les plans cités avec @ deviennent des références (reliées sur la toile).
      for (const c of cited) {
        if (!state.edges.some((e) => e.from === c.id && e.to === node.id)) {
          await data.addEdge({ id: crypto.randomUUID(), projectId: project.id, from: c.id, to: node.id, role: kind === "video" ? "start_frame" : "character_ref" });
        }
      }
      try {
        if (kind === "image" || kind === "character" || kind === "edit") {
          let r;
          if (kind === "edit") {
            const src = sources("source")[0] ?? cited[0];
            if (!src) throw new Error("no_source");
            r = await gen.edit({ instruction: styled, model: used, aspectRatio: project.aspectRatio, source: { url: src.data.mediaUrl!, prompt: src.data.prompt, name: src.name } });
          } else {
            const refs = [...sources("character_ref"), ...cited];
            if (kind === "character" && !refs.length) throw new Error("no_reference");
            r = refs.length
              ? await gen.character({ prompt: styled, model: used, aspectRatio: project.aspectRatio, references: refs.slice(0, 5).map((n) => ({ url: n.data.mediaUrl!, name: n.name, prompt: n.data.prompt })) })
              : await gen.image({ prompt: styled, model: used, aspectRatio: project.aspectRatio });
          }
          await data.upsertNode({ ...running, type: "image", data: { ...running.data, status: "done", mediaUrl: r.url, width: r.width, height: r.height } });
          if (!project.thumbnailUrl) await data.updateProject(project.id, { thumbnailUrl: r.url });
        } else if (kind === "video") {
          const start = sources("start_frame")[0] ?? cited[0];
          const frame = start?.data.posterUrl ?? start?.data.mediaUrl;
          if (!frame) throw new Error("no_start_frame");
          if (endFrameId) await data.addEdge({ id: crypto.randomUUID(), projectId: project.id, from: endFrameId, to: node.id, role: "end_frame" });
          const r = await gen.video({ prompt: styled, model: used, startFrameUrl: frame, aspectRatio: project.aspectRatio });
          const durationMs = (seconds ?? 5) * 1000;
          await data.upsertNode({ ...running, type: "video", data: { ...running.data, status: "done", mediaUrl: r.url, posterUrl: r.posterUrl, width: r.width, height: r.height, durationMs } });
        } else {
          const r = kind === "voice"
            ? await gen.voice({ text: prompt, voice: voice ?? "claire", model: used })
            : await gen.music({ prompt, model: used, durationMs: musicDurationMs(used) });
          await data.upsertNode({ ...running, type: "audio", name: running.name.startsWith("Nouvelle") ? titleFrom(prompt).slice(0, 32) : running.name, data: { ...running.data, status: "done", mediaUrl: r.url, durationMs: r.durationMs } });
        }
      } catch (err) {
        await data.refund(cost, key);
        const code = err instanceof Error ? err.message : "";
        const msg = code === "no_start_frame" ? "Reliez ou citez (@) une image de départ. Crédits rendus."
          : code === "no_reference" ? "Reliez une image du personnage à ce nœud. Crédits rendus."
          : code === "no_source" ? "Reliez ou citez (@) l'image à modifier. Crédits rendus."
          : "La génération n'a pas abouti. Vos crédits ont été rendus.";
        await data.upsertNode({ ...running, data: { ...running.data, status: "failed", error: msg } });
      }
    },
    plan,
    media: state.nodes.filter((n) => ["image", "video", "audio"].includes(n.type) && n.data.mediaUrl && !n.data.archived),
    upgrade() {
      setNotice("Ce modèle est réservé à un plan supérieur. Les abonnements arrivent avec Stripe ; en attendant, la page Tarifs détaille les plans.");
      router.push("/pricing");
    },
    async editFrom(node) {
      await addGenerator("edit_image", node);
    },
    async archive(node) {
      await data.upsertNode({ ...node, data: { ...node.data, archived: true } });
      setNotice(`« ${node.name} » archivé. Retrouvez-le dans Ressources > Archivés.`);
    },
    async characterFrom(node) {
      await addGenerator("character_ref", node);
    },
    async rename(node) {
      const name = await ask({ title: "Renommer", label: "Nom du plan", initial: node.name, confirm: "Renommer" });
      if (name) await data.upsertNode({ ...node, name });
    },
    async animate(node) {
      await addGenerator("generate_video", node);
    },
    async regenerate(node) {
      const copy: CanvasNode = { ...node, id: crypto.randomUUID(), type: "generator", name: `${node.name} (variante)`, x: node.x, y: node.y + 40, data: { action: "generate_image", prompt: node.data.prompt, model: node.data.model ?? DEFAULT_MODEL.image, status: "idle" } };
      await data.upsertNode(copy);
      await actions.runGenerator(copy, { prompt: node.data.prompt ?? "", model: copy.data.model! });
    },
    update: (n) => data.upsertNode(n),
    remove: (ids) => data.deleteNodes(ids),
    async duplicate(node) {
      await data.upsertNode({ ...node, id: crypto.randomUUID(), name: `${node.name} (copie)`, x: node.x + 40, y: node.y + 40 });
    },
    async toggleSection(id) {
      const s = state.sections.find((x) => x.id === id);
      if (s) await data.upsertSection({ ...s, collapsed: !s.collapsed });
    },
    async dissolveSection(id) {
      await data.deleteSection(id);
    },
    async sendToEditor(node) {
      if (node.type === "audio") await appendAudio(project.id, node);
      else await appendToTimeline(project.id, node);
      setNotice(`« ${node.name} » ajouté à la fin du montage.`);
    },
    preview: setPreview,
  };

  /** Position absolue d'un nœud (les enfants de section sont en coordonnées relatives). */
  const absolute = (n: CanvasNode) => {
    const s = n.sectionId ? state.sections.find((x) => x.id === n.sectionId) : null;
    return { x: n.x + (s?.x ?? 0), y: n.y + (s?.y ?? 0) };
  };

  const createSection = async () => {
    const chosen = state.nodes.filter((n) => selected.has(n.id));
    const { w, h } = mediaSize(project.aspectRatio);
    if (!chosen.length) {
      const p = centerPoint();
      await data.upsertSection({ id: crypto.randomUUID(), projectId: project.id, name: "Nouvelle section", locked: false, collapsed: false, x: p.x, y: p.y, w: w + 2 * GAP, h: SECTION_HEADER + h + CAPTION + GAP });
      return;
    }
    if (chosen.every((n) => n.sectionId && n.sectionId === chosen[0].sectionId)) {
      setNotice("Ces plans sont déjà dans une section.");
      return;
    }
    const pts = chosen.map(absolute);
    const x = Math.min(...pts.map((p) => p.x)) - GAP;
    const y = Math.min(...pts.map((p) => p.y)) - SECTION_HEADER;
    const right = Math.max(...pts.map((p) => p.x)) + w + GAP;
    const bottom = Math.max(...pts.map((p) => p.y)) + h + CAPTION + GAP;
    const section = { id: crypto.randomUUID(), projectId: project.id, name: titleFrom(chosen[0].data.prompt ?? chosen[0].name), locked: false, collapsed: false, x, y, w: right - x, h: bottom - y };
    await data.upsertSection(section);
    await data.upsertNodes(chosen.map((n, i) => ({ ...n, sectionId: section.id, x: pts[i].x - x, y: pts[i].y - y })));
  };

  const copy = () => {
    clipboard = state.nodes.filter((n) => selected.has(n.id));
    if (clipboard.length) setNotice(`${clipboard.length} plan${clipboard.length > 1 ? "s copiés" : " copié"}.`);
  };
  const paste = async () => {
    if (!clipboard.length) return;
    const copies = clipboard.map((n) => {
      const p = absolute(n);
      return { ...structuredClone(n), id: crypto.randomUUID(), projectId: project.id, sectionId: null, x: p.x + 60, y: p.y + 60, name: `${n.name} (copie)` };
    });
    await data.upsertNodes(copies);
  };

  const onChange = useCallback((changes: NodeChange[]) => {
    // Supprimer au clavier passe par la couche de données (les sections ne se suppriment pas ainsi).
    const removed = changes.filter((c) => c.type === "remove").map((c) => c.id).filter((id) => byId.has(id));
    if (removed.length) data.deleteNodes(removed);
    onNodesChange(changes.filter((c) => c.type !== "remove"));
  }, [onNodesChange, byId]);

  const onDragStop = useCallback((_: unknown, __: Node, dragged: Node[]) => {
    for (const d of dragged) {
      const n = byId.get(d.id);
      if (n) data.upsertNode({ ...n, x: d.position.x, y: d.position.y });
      const s = state.sections.find((x) => x.id === d.id);
      if (s) data.upsertSection({ ...s, x: d.position.x, y: d.position.y });
    }
  }, [byId, state.sections]);

  const addNote = async () => {
    const p = centerPoint();
    await data.upsertNode({ id: crypto.randomUUID(), projectId: project.id, sectionId: null, type: "text", name: "Note", x: p.x, y: p.y, data: { prompt: "" } });
  };

  const empty = state.nodes.length === 0 && state.sections.length === 0;

  return (
    <CanvasActionsContext.Provider value={actions}>
      <div className="relative size-full bg-canvas"
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); importFiles(e.dataTransfer.files); } }}
        onKeyDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("input, textarea, select, [contenteditable]")) return;
          if (e.key === "Escape") { setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n))); return; }
          if ((e.metaKey || e.ctrlKey) && e.key === "c") { copy(); return; }
          if ((e.metaKey || e.ctrlKey) && e.key === "v") { e.preventDefault(); paste(); return; }
          if ((e.metaKey || e.ctrlKey) && e.key === "1") { e.preventDefault(); flow.fitView({ padding: 0.25, duration: 200 }); return; }
          if (e.metaKey || e.ctrlKey) return;
          if (e.key === "s" || e.key === "S") { e.preventDefault(); createSection(); }
          if (e.key === "t" || e.key === "T") { e.preventDefault(); addNote(); }
          if (e.key === "h" || e.key === "H") setHand((v) => !v);
          if (e.key === "v" || e.key === "V") setHand(false);
        }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onChange}
          onNodeDragStop={onDragStop}
          panOnDrag={hand ? true : [1, 2]}
          selectionOnDrag={!hand}
          panOnScroll
          zoomOnScroll={false}
          zoomActivationKeyCode={["Meta", "Control"]}
          deleteKeyCode={["Backspace", "Delete"]}
          minZoom={0.1}
          maxZoom={2}
          fitView
          fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
          proOptions={{ hideAttribution: true }}
          aria-label="Toile du projet"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-border)" />
        </ReactFlow>

        <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
          <VerticalToolbar zoom={Math.round(zoom * 100)}>
            <Menu>
              <MenuTrigger asChild>
                <IconButton tone="solid" label="Ajouter" icon={<Plus className="size-5" />} />
              </MenuTrigger>
              <MenuContent side="right">
                <MenuItem icon={<Upload />} onSelect={() => fileInput.current?.click()}>Importer un fichier</MenuItem>
                <MenuItem icon={<StickyNote />} onSelect={addNote}>Note</MenuItem>
                <MenuItem icon={<ImageIcon />} onSelect={() => addGenerator("generate_image")}>Générer une image</MenuItem>
                <MenuSub>
                  <MenuSubTrigger icon={<Video />}>Générer une vidéo</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem disabled>Sélectionnez une image puis « Animer cette image »</MenuItem>
                  </MenuSubContent>
                </MenuSub>
                <MenuItem icon={<Mic />} onSelect={() => addGenerator("generate_voice")}>Générer une voix</MenuItem>
                <MenuItem icon={<Music />} onSelect={() => addGenerator("generate_music")}>Générer de la musique</MenuItem>
              </MenuContent>
            </Menu>
            <IconButton label="Sélection" shortcut="V" active={!hand} onClick={() => setHand(false)} icon={<MousePointer2 className="size-5" />} />
            <IconButton label="Main" shortcut="H" active={hand} onClick={() => setHand(true)} icon={<Hand className="size-5" />} />
            <IconButton label={selected.size ? "Grouper dans une section" : "Nouvelle section"} shortcut="S" onClick={createSection} icon={<BoxSelect className="size-5" />} />
            <IconButton label="Note" shortcut="T" onClick={addNote} icon={<Type className="size-5" />} />
            <ToolbarDivider />
            <IconButton label="Ressources" active={showResources} onClick={() => setShowResources((v) => !v)} icon={<Images className="size-5" />} />
            <IconButton label="Histoire" onClick={() => router.push(`/p/${project.id}?view=story`)} icon={<FileText className="size-5" />} />
            <IconButton label="Montage" onClick={() => router.push(`/p/${project.id}?view=editor`)} icon={<Clapperboard className="size-5" />} />
            <ToolbarDivider />
            <IconButton label="Tout afficher" shortcut="Ctrl+1" onClick={() => flow.fitView({ padding: 0.25, duration: 200 })} icon={<Maximize className="size-5" />} />
            <IconButton label="Réglages (bientôt)" aria-disabled icon={<Settings className="size-5" />} />
          </VerticalToolbar>
        </div>

        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2">
          <label className="sr-only" htmlFor="project-ratio">Format du projet</label>
          <select id="project-ratio" value={project.aspectRatio} title="Format des prochaines générations"
            onChange={(e) => data.updateProject(project.id, { aspectRatio: e.target.value as Project["aspectRatio"] })}
            className="h-9 border border-border bg-surface px-2 text-sm text-text-muted shadow-toolbar">
            {["16:9", "9:16", "1:1", "21:9", "4:3", "3:4", "5:4"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => setStylesOpen(true)} className="h-9 border border-dashed border-border-input bg-surface px-3 text-sm uppercase tracking-wide shadow-toolbar hover:bg-surface-sunken">
            {style ? style.name : "Aucun style"}<span className="sr-only"> : changer de style</span>
          </button>
        </div>
        <input ref={fileInput} type="file" multiple hidden accept="image/*,video/*,audio/*" onChange={(e) => { importFiles(e.target.files); e.target.value = ""; }} aria-label="Importer des fichiers" />
        <StylePicker open={stylesOpen} onOpenChange={setStylesOpen} value={project.styleId}
          onPick={async (s) => { await data.updateProject(project.id, { styleId: s?.id ?? null }); setStylesOpen(false); setNotice(s ? `Style « ${s.name} » appliqué aux prochaines générations.` : "Style retiré."); }} />

        {showResources && (
          <div className="absolute left-20 top-4 z-20 flex max-h-[calc(100%-2rem)] w-96 flex-col border border-text bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <h2 className="text-lg">Ressources</h2>
              <IconButton label="Fermer les ressources" className="size-8" icon={<X className="size-4" />} onClick={() => setShowResources(false)} />
            </div>
            <ResourceList nodes={state.nodes} sections={state.sections} selected={selected}
              onRestore={(n) => data.upsertNode({ ...n, data: { ...n.data, archived: false } })}
              onPick={(n) => {
                setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === n.id })));
                const abs = flow.getInternalNode(n.id)?.internals.positionAbsolute;
                if (abs) flow.setCenter(abs.x + 150, abs.y + 150, { zoom: 0.9, duration: 300 });
              }}
              onLocateSection={(id) => { const s = state.sections.find((x) => x.id === id); if (s) flow.fitBounds({ x: s.x, y: s.y - 60, width: s.w, height: s.h + 60 }, { duration: 300, padding: 0.2 }); }} />
          </div>
        )}

        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <p className="text-xl">Toile vide</p>
              <p className="mt-2 text-text-muted">Décrivez votre film à l&apos;agent à droite, ou ajoutez un plan avec le bouton +.</p>
            </div>
          </div>
        )}

        {notice && (
          <div role="alert" className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 border border-border bg-surface px-4 py-3 shadow-pop">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="text-sm text-text-muted underline">Fermer</button>
          </div>
        )}

        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)} title={preview?.name ?? ""} description={preview?.data.prompt}>
          {preview?.data.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.data.posterUrl ?? preview.data.mediaUrl} alt={preview.data.prompt ?? preview.name} className="max-h-[70vh] w-full object-contain" />
          )}
        </Dialog>
      </div>
    </CanvasActionsContext.Provider>
  );
}
