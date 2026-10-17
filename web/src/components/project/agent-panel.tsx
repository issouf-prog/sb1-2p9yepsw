"use client";

import { useReactFlow } from "@xyflow/react";
import { ChevronsRight, ChevronsLeft, Plus, Paperclip, AtSign, Mic, ArrowUp, ChevronDown, Bot, HelpCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { data, type CanvasNode, type ChatMessage, type ContentBlock, type Conversation } from "@/lib/data";
import { runAgentTurn } from "@/lib/agent/run";
import { useLive } from "@/hooks/use-live";
import { IconButton } from "@/components/ui/icon-button";
import { Chip } from "@/components/ui/chip";
import { ActionCard, AssetChip, UserMessage, AgentMessage } from "@/components/ui/agent";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { fileToNode } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/menu";
import { useApp } from "@/components/app/app-context";
import { cn } from "@/lib/cn";

const SUGGESTIONS = ["Monte le film", "Anime l'image sélectionnée", "Une nouvelle scène : la tempête arrive"];

/** Démarrages déjà lancés (évite un double tour en mode strict de React). */
const started = new Set<string>();

export function AgentPanel({ projectId, selection, nodes, collapsed, onCollapse }: {
  projectId: string;
  selection: string[];
  nodes: CanvasNode[];
  collapsed: boolean;
  onCollapse: (c: boolean) => void;
}) {
  const { openTopUp } = useApp();
  const router = useRouter();
  const flow = useReactFlow();
  const convs = useLive(() => data.listConversations(projectId), [projectId], projectId);
  const [convId, setConvId] = useState<string | null>(null);
  const active: Conversation | undefined = convs.value?.find((c) => c.id === convId) ?? convs.value?.[0];
  const msgs = useLive(() => (active ? data.listMessages(active.id) : Promise.resolve([] as ChatMessage[])), [active?.id], projectId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const attach = useRef<HTMLInputElement>(null);

  /** Pièces jointes : importées sur la toile puis citées dans le message. */
  const attachFiles = async (files: FileList | null) => {
    // Copie immédiate : la FileList est vidée quand on réinitialise le champ.
    const list = Array.from(files ?? []);
    const canvasNow = await data.canvas(projectId);
    const x = Math.max(80, ...canvasNow.sections.map((s) => s.x + s.w + 80), ...canvasNow.nodes.map((n) => n.x + 360));
    let i = 0;
    for (const f of list) {
      const r = await fileToNode(f);
      if (!r.ok) { setHint(r.error); continue; }
      await data.upsertNode({ ...r.node, projectId, sectionId: null, x, y: 80 + i * 320 });
      setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}@${r.node.name.replace(/\s+/g, "_")} `);
      i++;
    }
  };

  /** Dictée : reconnaissance vocale du navigateur (Chrome, Edge, Safari). */
  const dictate = () => {
    type SR = { lang: string; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return setHint("La dictée n'est pas disponible dans ce navigateur. Essayez Chrome ou Edge.");
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.onresult = (e) => { const said = Array.from(e.results).map((r) => r[0].transcript).join(" "); setText((t) => `${t}${t ? " " : ""}${said}`); };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setHint("Micro indisponible ou refusé."); };
    setListening(true);
    rec.start();
  };

  const send = async (content: string, conv?: Conversation) => {
    const c = conv ?? active ?? (await data.createConversation(projectId, content.slice(0, 40)));
    setConvId(c.id);
    const msg: ChatMessage = {
      id: crypto.randomUUID(), conversationId: c.id, role: "user", content: [{ type: "text", text: content }], actions: [],
      contextNodeIds: selection, createdAt: new Date().toISOString(),
    };
    await data.upsertMessage(msg);
    setBusy(true);
    try {
      await runAgentTurn({ projectId, conversationId: c.id, text: content, selectedNodeIds: selection });
    } finally {
      setBusy(false);
    }
  };

  // Premier tour automatique avec le prompt saisi sur l'accueil.
  useEffect(() => {
    if (started.has(projectId)) return;
    started.add(projectId);
    data.getProject(projectId).then(async (p) => {
      if (!p?.pendingPrompt) return;
      const prompt = p.pendingPrompt;
      await data.updateProject(projectId, { pendingPrompt: null });
      const c = await data.createConversation(projectId, prompt.slice(0, 40));
      await send(prompt, c);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.value]);

  const focusNode = (id: string) => {
    const n = flow.getNode(id);
    if (!n) return;
    flow.setNodes((ns) => ns.map((x) => ({ ...x, selected: x.id === id })));
    const abs = flow.getInternalNode(id)?.internals.positionAbsolute ?? n.position;
    flow.setCenter(abs.x + (n.measured?.width ?? 200) / 2, abs.y + (n.measured?.height ?? 200) / 2, { zoom: 0.9, duration: 300 });
  };

  const renderBlock = (b: ContentBlock, i: number) => {
    if (b.type === "text") return <span key={i}>{b.text}</span>;
    if (b.type === "asset") return <AssetChip key={i} kind={b.kind} label={b.label} onClick={() => focusNode(b.nodeId)} />;
    return <Button key={i} variant="secondary" size="sm" className="mt-2" onClick={b.action === "topup" ? openTopUp : () => router.push(`/p/${projectId}?view=editor`)}>{b.label}</Button>;
  };

  const selectedNodes = nodes.filter((n) => selection.includes(n.id) && n.data.mediaUrl && (n.type === "image" || n.type === "video"));

  if (collapsed) {
    return (
      <aside aria-label="Agent" className="flex w-12 flex-col items-center border-l border-border bg-surface py-3">
        <IconButton label="Ouvrir l'agent" icon={<ChevronsLeft className="size-5" />} onClick={() => onCollapse(false)} />
      </aside>
    );
  }

  return (
    <aside aria-label="Agent" className="flex h-full w-full flex-col border-l border-border bg-surface lg:w-[var(--size-agent-panel)]">
      <div className="flex h-14 items-center gap-1 border-b border-border px-2">
        <IconButton label="Replier l'agent" icon={<ChevronsRight className="size-5" />} onClick={() => onCollapse(true)} />
        <Bot aria-hidden className="mx-1 size-5 text-text-muted" />
        <Menu>
          <MenuTrigger asChild>
            <button className="inline-flex min-w-0 flex-1 items-center gap-1 px-1 text-left text-base text-text-muted hover:text-text">
              <span className="truncate">{active?.title ?? "Nouvelle conversation"}</span>
              <ChevronDown aria-hidden className="size-4 shrink-0" />
              <span className="sr-only">, changer de conversation</span>
            </button>
          </MenuTrigger>
          <MenuContent side="bottom" align="start">
            {(convs.value ?? []).length === 0 && <MenuItem disabled>Aucune conversation</MenuItem>}
            {(convs.value ?? []).map((c) => <MenuItem key={c.id} onSelect={() => setConvId(c.id)}>{c.title}</MenuItem>)}
          </MenuContent>
        </Menu>
        <IconButton label="Nouvelle conversation" icon={<Plus className="size-5" />}
          onClick={async () => { const c = await data.createConversation(projectId); setConvId(c.id); }} />
      </div>

      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
        {!msgs.value?.length && !busy && (
          <div className="pt-8 text-center">
            <p className="text-xl">Que fait-on ?</p>
            <p className="mt-2 text-text-muted">Décrivez une scène : je crée les plans, les anime et range la toile.</p>
          </div>
        )}
        {msgs.value?.map((m) =>
          m.role === "user" ? (
            <UserMessage key={m.id}>{m.content.map(renderBlock)}</UserMessage>
          ) : (
            <div key={m.id} className="space-y-3">
              {m.actions.map((a) => (
                <ActionCard key={a.id} label={a.label} status={a.status} detail={a.errorUser}
                  action={a.status === "failed" && a.tool === "spend" ? <Button variant="secondary" size="sm" onClick={openTopUp}>Recharger mes crédits</Button> : undefined} />
              ))}
              {m.content.length > 0 && <AgentMessage>{m.content.map(renderBlock)}</AgentMessage>}
            </div>
          ),
        )}
        {busy && <p className="text-sm text-text-muted">L&apos;agent travaille…</p>}
        <a href="#" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"><HelpCircle aria-hidden className="size-4" />Besoin d&apos;aide</a>
      </div>

      <div className="border-t border-border p-3">
        {!busy && msgs.value?.length ? (
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((s) => <Chip key={s} size="sm" className="shrink-0" onClick={() => setText(s)}>{s}</Chip>)}
          </div>
        ) : null}
        {selectedNodes.length > 0 && (
          <div className="mb-2 flex gap-2" aria-label="Plans sélectionnés, vus par l'agent">
            {selectedNodes.slice(0, 4).map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n.id} src={n.data.posterUrl ?? n.data.mediaUrl} alt={n.name} title={n.name} className="size-14 border border-border object-cover" />
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim() && !busy) { send(text.trim()); setText(""); } }}>
          <label htmlFor="agent-input" className="sr-only">Message à l&apos;agent</label>
          <MentionTextarea id="agent-input" value={text} onValueChange={setText} nodes={nodes} rows={3} maxLength={4000}
            onEnter={() => (document.getElementById("agent-input") as HTMLTextAreaElement | null)?.form?.requestSubmit()}
            placeholder="Demandez une scène, un plan, une variante… (@ pour citer un plan)"
            className="block w-full resize-none bg-transparent px-2 py-1 text-lg outline-none placeholder:text-text-subtle" />
          {hint && <p role="status" className="px-2 text-sm text-text-muted">{hint} <button type="button" className="underline" onClick={() => setHint(null)}>OK</button></p>}
          <input ref={attach} type="file" multiple hidden accept="image/*,video/*,audio/*" aria-label="Joindre des fichiers" onChange={(e) => { attachFiles(e.target.files); e.target.value = ""; }} />
          <div className="flex items-center gap-1">
            <IconButton type="button" label="Joindre un fichier" icon={<Paperclip className="size-5 text-text-muted" />} onClick={() => attach.current?.click()} />
            <IconButton type="button" label="Citer un plan" icon={<AtSign className="size-5 text-text-muted" />}
              onClick={() => { setText((t) => `${t}${t && !t.endsWith(" ") ? " " : ""}@`); requestAnimationFrame(() => document.getElementById("agent-input")?.focus()); }} />
            <span className="ml-auto mr-2 text-sm text-text-muted" title="L'agent choisit le modèle">Auto</span>
            {text.trim() ? (
              <IconButton tone="round" type="submit" label="Envoyer" disabled={busy} icon={<ArrowUp className="size-5" />} />
            ) : (
              <IconButton tone="round" type="button" label={listening ? "Écoute en cours…" : "Dicter"} active={listening} onClick={dictate}
                icon={<Mic className={cn("size-5", listening && "animate-pulse")} />} />
            )}
          </div>
        </form>
      </div>
    </aside>
  );
}
