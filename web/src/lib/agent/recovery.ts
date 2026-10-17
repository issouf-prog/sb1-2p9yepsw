// Reprise après interruption (page fermée ou rechargée pendant un travail).
// Simulation côté navigateur : avec le backend, les tours tournent dans Trigger.dev et survivent
// à la fermeture de l'onglet ; le même nettoyage tournera dans la tâche poll-stuck-generations.
import { data } from "../data";

const HB = (p: string) => `studio-heartbeat:${p}`;
const PENDING = (p: string, id: string) => `studio-pending:${p}:${id}`;
const STALE_MS = 3000;

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* idem */ } },
  keys: () => { try { return Object.keys(localStorage); } catch { return []; } },
};

const active = new Map<string, number>();

/** Signale qu'un travail tourne dans cet onglet pour ce projet ; appeler la fonction rendue à la fin. */
export function beginWork(projectId: string): () => void {
  active.set(projectId, (active.get(projectId) ?? 0) + 1);
  const beat = () => store.set(HB(projectId), String(Date.now()));
  beat();
  const timer = setInterval(beat, 1000);
  return () => {
    clearInterval(timer);
    const n = (active.get(projectId) ?? 1) - 1;
    if (n <= 0) { active.delete(projectId); store.del(HB(projectId)); } else active.set(projectId, n);
  };
}

/** Crédits débités d'avance et pas encore consommés par une génération réussie. */
export const pending = {
  set: (projectId: string, id: string, credits: number, key: string) => store.set(PENDING(projectId, id), JSON.stringify({ credits, key })),
  consume: (projectId: string, id: string, credits: number) => {
    const raw = store.get(PENDING(projectId, id));
    if (!raw) return;
    const v = JSON.parse(raw) as { credits: number; key: string };
    v.credits = Math.max(0, v.credits - credits);
    store.set(PENDING(projectId, id), JSON.stringify(v));
  },
  clear: (projectId: string, id: string) => store.del(PENDING(projectId, id)),
};

const INTERRUPTED = "Interrompu : la page a été fermée ou rechargée pendant ce travail. Les crédits non utilisés ont été rendus.";

/** Nettoie un projet dont un travail a été interrompu. Sans effet si un travail tourne encore (cet onglet ou un autre). */
export async function recoverInterrupted(projectId: string): Promise<number> {
  // Un battement récent peut venir de la page qu'on vient de recharger : on attend qu'il vieillisse.
  // S'il continue, un autre onglet travaille vraiment et on ne touche à rien.
  for (let i = 0; i < 3; i++) {
    if (active.has(projectId)) return 0;
    const hb = Number(store.get(HB(projectId)) ?? 0);
    const age = Date.now() - hb;
    if (!hb || age >= STALE_MS) break;
    if (i === 2) return 0;
    await new Promise((r) => setTimeout(r, STALE_MS - age + 250));
  }

  let refunded = 0;
  for (const k of store.keys().filter((x) => x.startsWith(`studio-pending:${projectId}:`))) {
    const v = JSON.parse(store.get(k) ?? "{}") as { credits?: number; key?: string };
    if (v.credits && v.key) {
      await data.refund(v.credits, `${v.key}:interrupted`);
      refunded += v.credits;
    }
    store.del(k);
  }

  const canvas = await data.canvas(projectId);
  const stuck = canvas.nodes.filter((n) => n.type === "generator" && n.data.status === "running");
  if (stuck.length) {
    await data.upsertNodes(stuck.map((n) => ({ ...n, data: { ...n.data, status: "failed" as const, error: "Génération interrompue. Crédits rendus." } })));
  }

  for (const c of await data.listConversations(projectId)) {
    for (const m of await data.listMessages(c.id)) {
      if (!m.actions.some((a) => a.status === "running")) continue;
      await data.upsertMessage({
        ...m,
        actions: m.actions.map((a) => (a.status === "running" ? { ...a, status: "failed", errorUser: INTERRUPTED } : a)),
        content: [...m.content, { type: "text", text: " Ce travail a été interrompu ; redemandez-le-moi pour le reprendre." }],
      });
    }
  }
  store.del(HB(projectId));
  return refunded;
}
