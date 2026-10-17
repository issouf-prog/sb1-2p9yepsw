// Un tour de l'agent. Version simulée : un planificateur à règles qui appelle les MÊMES outils
// (data + gen) que l'interface. La vraie version remplacera planTurn() par une boucle Claude
// avec appels d'outils, exécutée côté serveur ; executeTool() et les règles restent.

import { data, InsufficientCreditsError, type ActionRecord, type CanvasNode, type ChatMessage, type ContentBlock, type Section } from "../data";
import { DEFAULT_MODEL } from "../data/prices";
import { gen } from "../gen";
import { sectionSize, slot } from "../canvas";

interface TurnInput {
  projectId: string;
  conversationId: string;
  text: string;
  selectedNodeIds: string[];
}

const now = () => new Date().toISOString();

/** Découpe une idée en plans courts (simulation de la planification). */
function planShots(idea: string): { section: string; shots: string[] } {
  const base = idea.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  const section = base.length > 40 ? `${base.slice(0, 39).trimEnd()}…` : base;
  return {
    section,
    shots: [`Plan large d'ouverture — ${base}`, `Plan rapproché sur le personnage principal — ${base}`],
  };
}

export async function runAgentTurn({ projectId, conversationId, text, selectedNodeIds }: TurnInput): Promise<void> {
  const project = await data.getProject(projectId);
  if (!project) return;

  const reply: ChatMessage = {
    id: crypto.randomUUID(), conversationId, role: "assistant", content: [], actions: [], contextNodeIds: [], createdAt: now(),
  };
  const save = () => data.upsertMessage(structuredClone(reply));
  const act = async (tool: string, label: string): Promise<ActionRecord> => {
    const a: ActionRecord = { id: crypto.randomUUID(), tool, label, status: "running" };
    reply.actions.push(a);
    await save();
    return a;
  };
  const finish = async (a: ActionRecord, status: "done" | "failed", errorUser?: string) => {
    a.status = status;
    if (errorUser) a.errorUser = errorUser;
    await save();
  };
  const say = async (...blocks: ContentBlock[]) => {
    reply.content.push(...blocks);
    await save();
  };

  const lower = text.toLowerCase();
  const canvas = await data.canvas(projectId);

  // Demande d'animation d'une image sélectionnée.
  const selectedImage = canvas.nodes.find((n) => selectedNodeIds.includes(n.id) && n.type === "image" && n.data.mediaUrl);
  const wantsMontage = /montage|timeline/.test(lower);

  if (wantsMontage) {
    const a = await act("read_timeline", "Lire le montage");
    await finish(a, "done");
    await say({ type: "text", text: "Le montage automatique arrive dans une prochaine étape de construction. Vos plans sont prêts sur la toile." });
    return;
  }

  // Plan du lot : soit animer l'image sélectionnée, soit créer une séquence complète.
  const animateOnly = !!selectedImage && /anime|vidéo|video|bouger/.test(lower);
  const plan = planShots(text);
  const items = animateOnly
    ? [{ kind: "video" as const, model: DEFAULT_MODEL.video }]
    : [
        { kind: "image" as const, model: DEFAULT_MODEL.image },
        { kind: "image" as const, model: DEFAULT_MODEL.image },
        { kind: "video" as const, model: DEFAULT_MODEL.video },
      ];

  // Règle 1 : coût total vérifié et débité AVANT de lancer quoi que ce soit.
  const qa = await act("quote", "Estimer le coût");
  const total = await data.quote(items);
  await finish(qa, "done");
  const batchKey = `batch:${reply.id}`;
  const launch = await act("spend", `Lancer ${items.length} génération${items.length > 1 ? "s" : ""}`);
  try {
    await data.spend(total, batchKey);
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      await finish(
        launch,
        "failed",
        `Il manque ${e.needed - e.available} crédits pour ce lot (${e.needed} nécessaires, ${e.available} disponibles). Rien n'a été lancé ni débité.`,
      );
      await say(
        { type: "text", text: "Je n'ai rien lancé pour ne pas laisser une séquence à moitié faite. Rechargez vos crédits et redemandez-moi, je reprendrai au même endroit." },
      );
      return;
    }
    throw e;
  }
  await finish(launch, "done");

  let refund = 0;
  const unitCost = await Promise.all(items.map((i) => data.quote([i])));

  if (animateOnly && selectedImage) {
    const vid = await generateVideoFrom(projectId, selectedImage, text, project.aspectRatio, act, finish);
    if (!vid) refund += unitCost[0];
    else await say({ type: "text", text: "C'est fait : " }, { type: "asset", nodeId: vid.id, kind: "video", label: vid.name }, { type: "text", text: " est relié à l'image de départ." });
  } else {
    const sa = await act("create_section", "Créer une section");
    const section: Section = {
      id: crypto.randomUUID(), projectId, name: plan.section, locked: false, collapsed: false,
      x: 80, y: canvas.sections.reduce((m, s) => Math.max(m, s.y + s.h + 80), 80), ...sectionSize(project.aspectRatio, 3),
    };
    await data.upsertSection(section);
    await finish(sa, "done");

    const images: CanvasNode[] = [];
    for (const [i, shot] of plan.shots.entries()) {
      const node: CanvasNode = {
        id: crypto.randomUUID(), projectId, sectionId: section.id, type: "generator", name: i === 0 ? "Plan large" : "Plan rapproché",
        ...slot(project.aspectRatio, i), data: { action: "generate_image", prompt: shot, model: DEFAULT_MODEL.image, status: "running" },
      };
      await data.upsertNode(node);
      const a = await act("generate_image", `Générer « ${node.name} »`);
      try {
        const r = await gen.image({ prompt: shot, model: node.data.model!, aspectRatio: project.aspectRatio });
        Object.assign(node, { type: "image" });
        node.data = { ...node.data, status: "done", mediaUrl: r.url, width: r.width, height: r.height };
        await data.upsertNode(node);
        images.push(node);
        await finish(a, "done");
        if (!project.thumbnailUrl && i === 0) await data.updateProject(projectId, { thumbnailUrl: r.url });
      } catch {
        node.data = { ...node.data, status: "failed", error: "La génération n'a pas abouti. Les crédits de ce plan ont été rendus." };
        await data.upsertNode(node);
        refund += unitCost[i];
        await finish(a, "failed", "Ce plan n'a pas pu être généré. Ses crédits vous ont été rendus.");
      }
    }

    let video: CanvasNode | null = null;
    if (images[0]) {
      video = await generateVideoFrom(projectId, images[0], `Mouvement lent de caméra — ${plan.shots[0]}`, project.aspectRatio, act, finish, section.id, slot(project.aspectRatio, 2).x);
    }
    if (!video) refund += unitCost[2];

    const blocks: ContentBlock[] = [{ type: "text", text: "J'ai créé la section " }, { type: "asset", nodeId: section.id, kind: "section", label: section.name }, { type: "text", text: " avec " }];
    images.forEach((n, i) => {
      blocks.push({ type: "asset", nodeId: n.id, kind: "image", label: n.name });
      blocks.push({ type: "text", text: i < images.length - 1 ? " et " : "" });
    });
    if (video) blocks.push({ type: "text", text: ", puis j'ai animé le premier plan : " }, { type: "asset", nodeId: video.id, kind: "video", label: video.name }, { type: "text", text: "." });
    else blocks.push({ type: "text", text: "." });
    await say(...blocks);
  }

  if (refund > 0) {
    await data.refund(refund, batchKey);
    await say({ type: "text", text: ` ${refund} crédits ont été rendus pour ce qui n'a pas abouti.` });
  }
  if (project.pendingPrompt) await data.updateProject(projectId, { pendingPrompt: null });
}

async function generateVideoFrom(
  projectId: string,
  source: CanvasNode,
  prompt: string,
  aspectRatio: Parameters<typeof gen.video>[0]["aspectRatio"],
  act: (tool: string, label: string) => Promise<ActionRecord>,
  finish: (a: ActionRecord, s: "done" | "failed", e?: string) => Promise<void>,
  sectionId: string | null = source.sectionId,
  x = source.x + 360,
): Promise<CanvasNode | null> {
  const node: CanvasNode = {
    id: crypto.randomUUID(), projectId, sectionId, type: "generator", name: "Séquence 1",
    x, y: source.y, data: { action: "generate_video", prompt, model: DEFAULT_MODEL.video, status: "running" },
  };
  await data.upsertNode(node);
  await data.addEdge({ id: crypto.randomUUID(), projectId, from: source.id, to: node.id, role: "start_frame" });
  const a = await act("generate_video", "Animer le premier plan");
  try {
    const r = await gen.video({ prompt, model: node.data.model!, startFrameUrl: source.data.mediaUrl!, aspectRatio });
    node.type = "video";
    node.data = { ...node.data, status: "done", mediaUrl: r.url, posterUrl: r.posterUrl, width: r.width, height: r.height, durationMs: r.durationMs };
    await data.upsertNode(node);
    await finish(a, "done");
    return node;
  } catch {
    node.data = { ...node.data, status: "failed", error: "L'animation n'a pas abouti. Les crédits ont été rendus." };
    await data.upsertNode(node);
    await finish(a, "failed", "L'animation n'a pas abouti. Ses crédits vous ont été rendus.");
    return null;
  }
}
