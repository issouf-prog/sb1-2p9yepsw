// Types de domaine, calqués sur replica/schema.sql (noms en camelCase).

export type AspectRatio = "16:9" | "9:16" | "1:1" | "21:9" | "4:3" | "3:4" | "5:4";
export type Plan = "free" | "casual" | "standard" | "pro" | "studio" | "enterprise";

export interface Workspace {
  id: string;
  name: string;
  plan: Plan;
  creditBalance: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  aspectRatio: AspectRatio;
  styleId: string | null;
  visibility: "private" | "shared";
  thumbnailUrl: string | null;
  /** Premier prompt saisi sur l'accueil, consommé par le premier tour de l'agent. */
  pendingPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  projectId: string;
  name: string;
  locked: boolean;
  collapsed: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type NodeType = "text" | "image" | "video" | "generator";
export type GenStatus = "idle" | "running" | "done" | "failed";

export interface CanvasNode {
  id: string;
  projectId: string;
  sectionId: string | null;
  type: NodeType;
  name: string;
  /** Position relative à la section si sectionId, sinon absolue. */
  x: number;
  y: number;
  data: {
    prompt?: string;
    model?: string;
    action?: "generate_image" | "generate_video";
    status?: GenStatus;
    mediaUrl?: string;
    posterUrl?: string;
    width?: number;
    height?: number;
    durationMs?: number;
    favorite?: boolean;
    error?: string;
  };
}

export type EdgeRole = "prompt" | "start_frame" | "end_frame" | "character_ref" | "source";

export interface CanvasEdge {
  id: string;
  projectId: string;
  from: string;
  to: string;
  role: EdgeRole;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "asset"; nodeId: string; kind: "image" | "video" | "section"; label: string }
  | { type: "button"; action: "topup" | "open_editor"; label: string };

export interface ActionRecord {
  id: string;
  tool: string;
  label: string;
  status: "running" | "done" | "failed";
  /** Message lisible pour l'utilisateur. Le détail technique n'est jamais stocké ici. */
  errorUser?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  actions: ActionRecord[];
  contextNodeIds: string[];
  createdAt: string;
}

export interface CanvasState {
  sections: Section[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface QuoteItem {
  kind: "image" | "video";
  model: string;
}

/** Document Histoire : JSON ProseMirror/TipTap. */
export interface StoryDocument {
  projectId: string;
  content: unknown;
  /** true tant que l'utilisateur ou l'agent n'a rien écrit (modèle d'exemple). */
  isTemplate: boolean;
  updatedAt: string;
}

export interface TimelineClip {
  id: string;
  nodeId: string;
  /** Durée affichée dans le film, en ms. */
  durationMs: number;
}

export interface TextClip {
  id: string;
  text: string;
  startMs: number;
  durationMs: number;
}

export interface Timeline {
  projectId: string;
  fps: 24 | 25 | 30;
  main: TimelineClip[];
  text: TextClip[];
  /** Verrou optimiste : l'agent et l'humain ne s'écrasent pas. */
  version: number;
}

export class ConflictError extends Error {
  constructor() {
    super("conflict");
  }
}

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public available: number) {
    super("insufficient_credits");
  }
}
