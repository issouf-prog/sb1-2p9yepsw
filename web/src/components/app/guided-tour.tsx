"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Étapes de la visite guidée, par vue du projet. Chaque étape vise un élément marqué data-tour. */
const STEPS: Record<string, { target: string; title: string; text: string }[]> = {
  canvas: [
    { target: "agent", title: "L'agent fait le travail", text: "Décrivez une scène ici : il écrit, génère les plans, les anime et range la toile. Chaque action apparaît sous forme de carte, avec son coût." },
    { target: "add", title: "Ajouter un plan vous-même", text: "Le bouton + crée une image, une vidéo, une voix ou une musique. Le coût s'affiche sur le bouton Lancer avant de dépenser quoi que ce soit." },
    { target: "style", title: "Format et style", text: "Ils s'appliquent aux prochaines générations du projet. Changez-les à tout moment." },
    { target: "resources", title: "Retrouver ses plans", text: "Tous les médias du projet, groupés par section, avec les favoris et les archives." },
  ],
  story: [
    { target: "story", title: "Le document du film", text: "Brief, narration, direction créative et scénario. L'agent le lit avant de générer, et le remplit pour vous dès le premier message." },
  ],
  editor: [
    { target: "editor-resources", title: "Monter le film", text: "Ajoutez les plans avec +, ou laissez l'agent construire la timeline. Glissez les clips pour les réordonner, coupez avec S." },
    { target: "export", title: "Exporter", text: "Le film complet, son compris, en un fichier vidéo." },
  ],
};

const KEY = "studio-tour";
type State = { active: boolean; done: string[] };
const read = (): State => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "") as State; } catch { return { active: false, done: [] }; }
};
const write = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ } };

export function startTour() {
  write({ active: true, done: [] });
}

/** Visite guidée non bloquante : une bulle à côté de l'élément visé, Suivant / Passer cette étape / Terminer. */
export function GuidedTour({ view }: { view: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ active: false, done: [] });
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const steps = STEPS[view] ?? [];

  useEffect(() => {
    const s = read();
    if (params.get("tour") === "1" && !s.active) { s.active = true; s.done = []; write(s); }
    setState(s);
    setI(0);
  }, [view, params]);

  const visible = state.active && !state.done.includes(view) && steps.length > 0;
  const step = steps[Math.min(i, steps.length - 1)];

  const measure = useCallback(() => {
    const el = step && document.querySelector(`[data-tour="${step.target}"]`);
    setBox(el ? el.getBoundingClientRect() : null);
  }, [step]);
  useLayoutEffect(() => {
    if (!visible) return;
    measure();
    const t = setInterval(measure, 500);
    window.addEventListener("resize", measure);
    return () => { clearInterval(t); window.removeEventListener("resize", measure); };
  }, [visible, measure]);

  if (!visible || !step) return null;

  const finishView = () => {
    const s = { ...state, done: [...state.done, view] };
    write(s);
    setState(s);
    const next = ["canvas", "story", "editor"].find((v) => !s.done.includes(v));
    if (next && next !== view) router.push(`${pathname}?view=${next}`);
    else { write({ active: false, done: s.done }); setState({ active: false, done: s.done }); }
  };
  const stop = () => { const s = { active: false, done: state.done }; write(s); setState(s); };

  // Bulle à gauche de l'élément s'il est à droite de l'écran, sinon à droite ; repli au centre.
  const W = 320;
  const pos = box
    ? box.left > window.innerWidth / 2
      ? { left: Math.max(16, box.left - W - 16), top: Math.min(window.innerHeight - 220, Math.max(16, box.top + 16)) }
      : { left: Math.min(window.innerWidth - W - 16, box.right + 16), top: Math.min(window.innerHeight - 220, Math.max(16, box.top)) }
    : { left: window.innerWidth / 2 - W / 2, top: 120 };

  return (
    <>
      {box && <div aria-hidden className="pointer-events-none fixed z-40 border-2 border-accent" style={{ left: box.left - 4, top: box.top - 4, width: box.width + 8, height: box.height + 8 }} />}
      <div role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-text"
        className="fixed z-50 border border-text bg-surface p-5 shadow-pop" style={{ ...pos, width: W }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-text-muted">Visite · {i + 1} / {steps.length}</p>
          <button onClick={stop} aria-label="Quitter la visite" className="-m-1 rounded-pill p-1 text-text-muted hover:text-text"><X className="size-4" /></button>
        </div>
        <h2 id="tour-title" className="mt-2 text-lg">{step.title}</h2>
        <p id="tour-text" className="mt-1 text-sm text-text-muted">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finishView}>Passer cette étape</Button>
          {i < steps.length - 1 ? (
            <Button size="sm" autoFocus onClick={() => setI(i + 1)}>Suivant</Button>
          ) : (
            <Button size="sm" autoFocus onClick={finishView}>{["canvas", "story", "editor"].filter((v) => v !== view && !state.done.includes(v)).length ? "Vue suivante" : "Terminer"}</Button>
          )}
        </div>
      </div>
    </>
  );
}
