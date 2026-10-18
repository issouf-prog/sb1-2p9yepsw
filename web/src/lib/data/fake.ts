// Couche de données simulée : tout vit dans localStorage, avec des événements pour imiter le temps réel.
// Même contrat que la future version Supabase (voir layer.ts).

import type { DataLayer } from "./layer";
import {
  InsufficientCreditsError,
  ConflictError,
  type CanvasEdge, type CanvasNode, type ChatMessage, type Conversation, type Profile, type Project, type Section, type Workspace,
  type StoryDocument, type Timeline, type Style,
} from "./types";
import { priceOf } from "./prices";
import { STYLE_CATALOG } from "./styles";

interface Db {
  me: Profile | null;
  workspace: Workspace;
  projects: Project[];
  sections: Section[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  conversations: Conversation[];
  messages: ChatMessage[];
  documents?: StoryDocument[];
  styles?: Style[];
  timelines?: Timeline[];
  ledgerKeys: string[];
}

const KEY = "studio-db-v1";
const SIGNUP_CREDITS = 300;

function empty(): Db {
  return {
    me: null,
    workspace: { id: crypto.randomUUID(), name: "Personnel", plan: "free", creditBalance: SIGNUP_CREDITS },
    projects: [], sections: [], nodes: [], edges: [], conversations: [], messages: [], ledgerKeys: [],
  };
}

let cache: Db | null = null;
const listeners = new Map<string, Set<() => void>>();

function load(): Db {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    cache = raw ? (JSON.parse(raw) as Db) : empty();
  } catch {
    cache = empty();
  }
  return cache;
}

function commit(projectId?: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // stockage plein ou bloqué : on garde l'état en mémoire
  }
  for (const id of [projectId, "*"]) {
    if (id) listeners.get(id)?.forEach((cb) => cb());
  }
}

const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => structuredClone(v);
const touch = (db: Db, projectId: string) => {
  const p = db.projects.find((x) => x.id === projectId);
  if (p) p.updatedAt = now();
};

export const fakeData: DataLayer = {
  async me() {
    return clone(load().me);
  },
  async signIn(name, email) {
    const db = load();
    db.me = { id: crypto.randomUUID(), name, email };
    commit();
    return clone(db.me);
  },
  async signOut() {
    cache = empty();
    commit();
  },

  async workspace() {
    return clone(load().workspace);
  },
  async listProjects() {
    return clone(load().projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getProject(id) {
    const p = load().projects.find((x) => x.id === id);
    // Projets créés avant le partage : valeurs par défaut.
    return p ? clone({ ...p, linkAccess: p.linkAccess ?? "none", invites: p.invites ?? [] }) : null;
  },
  async createProject({ name, aspectRatio, prompt, styleId }) {
    const db = load();
    const p: Project = {
      id: crypto.randomUUID(),
      workspaceId: db.workspace.id,
      name: name?.trim() || (prompt ? titleFrom(prompt) : "Sans titre"),
      aspectRatio,
      styleId: styleId ?? null,
      visibility: "private",
      thumbnailUrl: null,
      linkAccess: "none",
      invites: [],
      pendingPrompt: prompt?.trim() || null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.projects.push(p);
    commit("*");
    return clone(p);
  },
  async updateProject(id, patch) {
    const db = load();
    const p = db.projects.find((x) => x.id === id);
    if (!p) throw new Error("projet introuvable");
    Object.assign(p, patch, { updatedAt: now() });
    commit(id);
    commit("*");
    return clone(p);
  },
  async deleteProject(id) {
    const db = load();
    db.projects = db.projects.filter((p) => p.id !== id);
    db.sections = db.sections.filter((s) => s.projectId !== id);
    db.nodes = db.nodes.filter((n) => n.projectId !== id);
    db.edges = db.edges.filter((e) => e.projectId !== id);
    const convIds = new Set(db.conversations.filter((c) => c.projectId === id).map((c) => c.id));
    db.conversations = db.conversations.filter((c) => c.projectId !== id);
    db.messages = db.messages.filter((m) => !convIds.has(m.conversationId));
    db.documents = (db.documents ?? []).filter((d) => d.projectId !== id);
    db.timelines = (db.timelines ?? []).filter((t) => t.projectId !== id);
    commit("*");
  },

  async listStyles() {
    const db = load();
    return clone([...STYLE_CATALOG, ...(db.styles ?? []).filter((s) => s.workspaceId === db.workspace.id)]);
  },
  async createStyle({ name, referenceUrls, promptSuffix }) {
    const db = load();
    const s: Style = {
      id: crypto.randomUUID(), name, workspaceId: db.workspace.id, referenceUrls: referenceUrls.slice(0, 5),
      promptSuffix: promptSuffix ?? `dans le style « ${name} » défini par ses images de référence`, createdAt: now(),
    };
    db.styles = [...(db.styles ?? []), s];
    commit("*");
    return clone(s);
  },

  async canvas(projectId) {
    const db = load();
    return clone({
      sections: db.sections.filter((s) => s.projectId === projectId),
      nodes: db.nodes.filter((n) => n.projectId === projectId),
      edges: db.edges.filter((e) => e.projectId === projectId),
    });
  },
  async upsertSection(s) {
    const db = load();
    db.sections = [...db.sections.filter((x) => x.id !== s.id), clone(s)];
    touch(db, s.projectId);
    commit(s.projectId);
  },
  async upsertNode(n) {
    return fakeData.upsertNodes([n]);
  },
  async upsertNodes(ns) {
    if (!ns.length) return;
    const db = load();
    const ids = new Set(ns.map((n) => n.id));
    db.nodes = [...db.nodes.filter((x) => !ids.has(x.id)), ...clone(ns)];
    touch(db, ns[0].projectId);
    commit(ns[0].projectId);
  },
  async deleteNodes(ids) {
    const db = load();
    const set = new Set(ids);
    const projectId = db.nodes.find((n) => set.has(n.id))?.projectId;
    db.nodes = db.nodes.filter((n) => !set.has(n.id));
    db.edges = db.edges.filter((e) => !set.has(e.from) && !set.has(e.to));
    if (projectId) commit(projectId);
  },
  async addEdge(e) {
    const db = load();
    // Pas de doublon : une même paire et un même rôle ne se relient qu'une fois.
    if (db.edges.some((x) => x.from === e.from && x.to === e.to && x.role === e.role)) return;
    db.edges.push(clone(e));
    commit(e.projectId);
  },
  async deleteEdges(ids) {
    const db = load();
    const set = new Set(ids);
    const projectId = db.edges.find((e) => set.has(e.id))?.projectId;
    db.edges = db.edges.filter((e) => !set.has(e.id));
    if (projectId) commit(projectId);
  },

  async deleteSection(id) {
    const db = load();
    const s = db.sections.find((x) => x.id === id);
    if (!s) return;
    // Les nœuds de la section restent sur la toile, en position absolue.
    for (const n of db.nodes) if (n.sectionId === id) Object.assign(n, { sectionId: null, x: n.x + s.x, y: n.y + s.y });
    db.sections = db.sections.filter((x) => x.id !== id);
    commit(s.projectId);
  },

  async document(projectId) {
    return clone((load().documents ?? []).find((d) => d.projectId === projectId) ?? null);
  },
  async saveDocument(projectId, content) {
    const db = load();
    db.documents = [...(db.documents ?? []).filter((d) => d.projectId !== projectId), { projectId, content: clone(content), isTemplate: false, updatedAt: now() }];
    touch(db, projectId);
    commit(projectId);
  },

  async timeline(projectId) {
    const t = (load().timelines ?? []).find((x) => x.projectId === projectId);
    return clone(t ?? { projectId, fps: 30, main: [], text: [], version: 0 });
  },
  async saveTimeline(t) {
    const db = load();
    const current = (db.timelines ?? []).find((x) => x.projectId === t.projectId);
    if ((current?.version ?? 0) !== t.version) throw new ConflictError();
    const next = { ...clone(t), version: t.version + 1 };
    db.timelines = [...(db.timelines ?? []).filter((x) => x.projectId !== t.projectId), next];
    touch(db, t.projectId);
    commit(t.projectId);
    return clone(next);
  },

  async listConversations(projectId) {
    return clone(load().conversations.filter((c) => c.projectId === projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createConversation(projectId, title = "Nouvelle conversation") {
    const db = load();
    const c: Conversation = { id: crypto.randomUUID(), projectId, title, createdAt: now() };
    db.conversations.push(c);
    commit(projectId);
    return clone(c);
  },
  async listMessages(conversationId) {
    return clone(load().messages.filter((m) => m.conversationId === conversationId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async upsertMessage(m) {
    const db = load();
    db.messages = [...db.messages.filter((x) => x.id !== m.id), clone(m)];
    const projectId = db.conversations.find((c) => c.id === m.conversationId)?.projectId;
    commit(projectId);
  },

  async quote(items) {
    return items.reduce((sum, i) => sum + priceOf(i.kind, i.model), 0);
  },
  async spend(amount, key) {
    const db = load();
    if (db.ledgerKeys.includes(key)) return db.workspace.creditBalance;
    if (db.workspace.creditBalance < amount) throw new InsufficientCreditsError(amount, db.workspace.creditBalance);
    db.workspace.creditBalance -= amount;
    db.ledgerKeys.push(key);
    commit("*");
    return db.workspace.creditBalance;
  },
  async refund(amount, key) {
    const db = load();
    const k = `refund:${key}`;
    if (!db.ledgerKeys.includes(k)) {
      db.workspace.creditBalance += amount;
      db.ledgerKeys.push(k);
      commit("*");
    }
    return db.workspace.creditBalance;
  },
  async choosePlan(plan, credits) {
    const db = load();
    db.workspace.plan = plan;
    db.workspace.creditBalance += credits;
    commit("*");
    return clone(db.workspace);
  },
  async topUp(amount) {
    const db = load();
    db.workspace.creditBalance += amount;
    commit("*");
    return db.workspace.creditBalance;
  },

  subscribe(projectId, cb) {
    if (!listeners.has(projectId)) listeners.set(projectId, new Set());
    listeners.get(projectId)!.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.get(projectId)?.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  },
};

export function titleFrom(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? `${clean.slice(0, 47).trimEnd()}…` : clean;
}
