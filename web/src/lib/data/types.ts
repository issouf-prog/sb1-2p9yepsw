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
  linkAccess: "none" | "view" | "edit";
  invites: { email: string; access: "view" | "edit" }[];
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

export type NodeType = "text" | "image" | "video" | "audio" | "generator";
export type GenStatus = "idle" | "running" | "done" | "failed" | "flagged";

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
    action?: "generate_image" | "generate_video" | "generate_voice" | "generate_music" | "character_ref" | "edit_image";
    /** Durée demandée pour une vidéo (s). */
    seconds?: number;
    /** Résolution demandée pour une vidéo. */
    resolution?: "480p" | "720p" | "1080p";
    /** Nombre de résultats demandés (lot). */
    count?: number;
    /** Style appliqué au moment de la génération. */
    styleName?: string;
    archived?: boolean;
    /** Fichier importé par l'utilisateur (pas généré). */
    uploaded?: boolean;
    /** Voix choisie (generate_voice). */
    voice?: string;
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

export type EdgeRole = "prompt" | "start_frame" | "end_frame" | "character_ref" | "scene_ref" | "source";

export interface Style {
  id: string;
  name: string;
  /** Ajouté à la fin des prompts d'image et de vidéo. */
  promptSuffix: string;
  /** Catalogue (null) ou style créé par l'utilisateur. */
  workspaceId: string | null;
  /** Images de référence d'un style perso (1 à 5). */
  referenceUrls: string[];
  createdAt: string;
}

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
  | { type: "asset"; nodeId: string; kind: "image" | "video" | "audio" | "section"; label: string }
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
  kind: "image" | "video" | "voice" | "music" | "character" | "edit";
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

export interface AudioClip {
  id: string;
  nodeId: string;
  kind: "music" | "voice";
  startMs: number;
  durationMs: number;
  volume: number;
}

export interface Timeline {
  projectId: string;
  fps: 24 | 25 | 30;
  main: TimelineClip[];
  text: TextClip[];
  /** Piste musique / voix (facultative pour les timelines créées avant l'audio). */
  audio?: AudioClip[];
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
