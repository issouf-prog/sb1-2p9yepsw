"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { PromptBox, type PromptBoxHandle, type Ratio } from "@/components/ui/prompt-box";
import { Chip } from "@/components/ui/chip";
import { ProjectCard, FilmCard } from "@/components/ui/cards";
import { Button } from "@/components/ui/button";
import { ProjectMenu } from "@/components/app/project-menu";
import { useLive } from "@/hooks/use-live";
import { data, type Project } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { DEMO_FILMS } from "@/lib/seed/films";
import { StylePicker } from "@/components/project/style-picker";
import type { Style } from "@/lib/data";

const EXAMPLES = [
  "Un conte pour enfants sur une petite renarde courageuse",
  "Une publicité de 15 secondes pour un café de quartier",
  "Un court métrage noir sous la pluie à Marseille",
];

function Home() {
  const router = useRouter();
  const box = useRef<PromptBoxHandle>(null);
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState<Style | null>(null);
  const [picking, setPicking] = useState(false);
  const projects = useLive(() => data.listProjects(), []);

  const start = async (prompt?: string, view?: string) => {
    setBusy(true);
    const p = await data.createProject({ aspectRatio: ratio, prompt, styleId: style?.id ?? null });
    router.push(`/p/${p.id}${view ? `?view=${view}` : ""}`);
  };

  return (
    <main className="mx-auto max-w-[var(--size-content-max)] px-4 pb-24 sm:px-6">
      <section id="nouveau" aria-labelledby="titre" className="mx-auto max-w-[var(--size-prompt-max)] pt-16 text-center sm:pt-24">
        <h1 id="titre" className="text-2xl sm:text-display">Quel film fait-on aujourd&apos;hui ?</h1>
        <p className="mt-3 text-lg text-text-muted">Décrivez l&apos;idée : l&apos;agent écrit, génère et monte avec vous.</p>
        <PromptBox ref={box} className="mt-10 text-left" placeholder={EXAMPLES[0] + "…"} ratio={ratio} onRatioChange={setRatio} busy={busy} onSubmit={(t) => start(t)}
          styleLabel={style?.name ?? "Aucun style"} onStyleClick={() => setPicking(true)} />
        <StylePicker open={picking} onOpenChange={setPicking} value={style?.id ?? null} onPick={(s) => { setStyle(s); setPicking(false); box.current?.focus(); }} />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Chip onClick={() => start(undefined, "story")}>Du scénario au film</Chip>
          <Chip onClick={() => box.current?.focus()}>Du prompt au film</Chip>
          <Chip onClick={() => box.current?.setText("Crée la fiche de mon personnage principal : ")}>Créer des personnages</Chip>
          <Chip onClick={() => setPicking(true)}>Partir d&apos;un style</Chip>
          <Chip onClick={() => start()}>Toile vide</Chip>
          <Chip title="Bientôt" aria-disabled className="opacity-60">Découvrir</Chip>
        </div>
      </section>

      <section aria-labelledby="recents" className="mt-20">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 id="recents" className="text-xl">Projets récents</h2>
          <Link href="/projects?tab=all" className="inline-flex items-center gap-1 text-text-muted hover:text-text">Tous les projets <ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        {projects.loading ? (
          <div className="h-56 w-80 animate-pulse bg-surface-sunken" aria-label="Chargement des projets" />
        ) : projects.value!.length === 0 ? (
          <p className="border border-dashed border-border px-6 py-10 text-center text-text-muted">Vos projets apparaîtront ici. Lancez-vous avec une idée ci-dessus.</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {projects.value!.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} title={p.name} href={`/p/${p.id}`} thumbnailUrl={p.thumbnailUrl} updatedAt={formatDate(p.updatedAt)} menu={<ProjectMenu project={p} />} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="galerie" className="mt-16">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 id="galerie" className="text-xl">Créés avec Studio</h2>
          <Link href="/tv" className="inline-flex items-center gap-1 text-text-muted hover:text-text">Galerie <ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_FILMS.slice(0, 3).map((f) => <FilmCard key={f.id} {...f} />)}
        </div>
      </section>
      <footer className="mt-20 flex gap-6 border-t border-border pt-6 text-sm text-text-muted">
        <Link href="/pricing" className="hover:text-text">Tarifs</Link>
        <Link href="/legal/cgu" className="hover:text-text">Conditions d&apos;utilisation</Link>
        <Link href="/legal/confidentialite" className="hover:text-text">Confidentialité</Link>
      </footer>
    </main>
  );
}

function AllProjects() {
  const [q, setQ] = useState("");
  const projects = useLive(() => data.listProjects(), []);
  const list: Project[] = (projects.value ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="mx-auto max-w-[var(--size-content-max)] px-4 pb-24 pt-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl">Tous les projets</h1>
        <label className="relative">
          <span className="sr-only">Rechercher un projet</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" className="h-10 w-64 border border-border-input bg-surface pl-9 pr-3 outline-none focus:border-text" />
        </label>
      </div>
      {projects.loading ? (
        <div className="h-56 w-80 animate-pulse bg-surface-sunken" />
      ) : list.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-16 text-center">
          <p className="text-text-muted">{q ? "Aucun projet ne correspond." : "Aucun projet pour l'instant."}</p>
          {!q && <Link href="/projects"><Button className="mt-4">Commencer un projet</Button></Link>}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]">
          {list.map((p) => (
            <ProjectCard key={p.id} title={p.name} href={`/p/${p.id}`} thumbnailUrl={p.thumbnailUrl} updatedAt={formatDate(p.updatedAt)} menu={<ProjectMenu project={p} />} />
          ))}
        </div>
      )}
    </main>
  );
}

function ProjectsRouter() {
  return useSearchParams().get("tab") === "all" ? <AllProjects /> : <Home />;
}

export default function ProjectsPage() {
  return <Suspense><ProjectsRouter /></Suspense>;
}
