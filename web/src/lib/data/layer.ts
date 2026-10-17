// Contrat de la couche de données. L'implémentation simulée (fake.ts) et la future
// implémentation Supabase exposent exactement ces fonctions : les écrans n'importent que ce fichier.

import type {
  CanvasEdge, CanvasNode, CanvasState, ChatMessage, Conversation, Profile, Project, QuoteItem, Section, Workspace, AspectRatio,
} from "./types";

export interface DataLayer {
  me(): Promise<Profile | null>;
  signIn(name: string, email: string): Promise<Profile>;
  signOut(): Promise<void>;

  workspace(): Promise<Workspace>;
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: { name?: string; aspectRatio: AspectRatio; prompt?: string }): Promise<Project>;
  updateProject(id: string, patch: Partial<Pick<Project, "name" | "aspectRatio" | "thumbnailUrl" | "pendingPrompt">>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  canvas(projectId: string): Promise<CanvasState>;
  upsertSection(s: Section): Promise<void>;
  upsertNode(n: CanvasNode): Promise<void>;
  upsertNodes(ns: CanvasNode[]): Promise<void>;
  deleteNodes(ids: string[]): Promise<void>;
  addEdge(e: CanvasEdge): Promise<void>;

  listConversations(projectId: string): Promise<Conversation[]>;
  createConversation(projectId: string, title?: string): Promise<Conversation>;
  listMessages(conversationId: string): Promise<ChatMessage[]>;
  upsertMessage(m: ChatMessage): Promise<void>;

  /** Coût total d'un lot, depuis la table des prix. */
  quote(items: QuoteItem[]): Promise<number>;
  /** Débit atomique du lot entier. Lève InsufficientCreditsError sans rien débiter. */
  spend(amount: number, key: string): Promise<number>;
  refund(amount: number, key: string): Promise<number>;
  /** Recharge (simulée tant que Stripe n'est pas branché). */
  topUp(amount: number): Promise<number>;

  /** Temps réel : appelé à chaque changement de données du projet (ou global si projectId = "*"). */
  subscribe(projectId: string, cb: () => void): () => void;
}
