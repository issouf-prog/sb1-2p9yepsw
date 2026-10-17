"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { data, type Project } from "@/lib/data";
import { Brand } from "@/components/app/brand";
import { AccountCluster } from "@/components/app/account-cluster";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const VIEWS = [
  { id: "story", label: "Histoire" },
  { id: "canvas", label: "Toile" },
  { id: "stage", label: "Plateau 3D" },
  { id: "editor", label: "Montage" },
] as const;
export type View = (typeof VIEWS)[number]["id"];

export function ProjectHeader({ project, view }: { project: Project; view: View }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const save = async () => {
    setEditing(false);
    if (name.trim() && name.trim() !== project.name) await data.updateProject(project.id, { name: name.trim() });
    else setName(project.name);
  };
  return (
    <header className="flex h-[var(--size-project-header)] items-center gap-3 border-b border-border bg-surface px-3 sm:px-5">
      <Brand compact />
      {editing ? (
        <input autoFocus value={name} maxLength={120} onChange={(e) => setName(e.target.value)} onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(project.name); setEditing(false); } }}
          aria-label="Nom du projet" className="h-9 w-48 border border-border-input px-2 outline-none focus:border-text" />
      ) : (
        <button onClick={() => setEditing(true)} title={`${project.name} (renommer)`} className="max-w-32 truncate text-lg text-text-muted hover:text-text sm:max-w-48">
          {project.name}
        </button>
      )}
      <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
      <Link href="/references" className="hidden items-center gap-1.5 text-base hover:underline sm:inline-flex"><BookOpen aria-hidden className="size-4" />Références</Link>

      <nav aria-label="Vues du projet" className="mx-auto hidden md:block">
        <ul className="flex items-center gap-8">
          {VIEWS.map((v) => (
            <li key={v.id}>
              <Link href={`/p/${project.id}?view=${v.id}`} aria-current={view === v.id ? "page" : undefined}
                className={cn("inline-flex items-center gap-2 text-nav uppercase", view === v.id ? "text-text" : "text-text-muted hover:text-text")}>
                {v.label}
                <span aria-hidden className={cn("size-1.5 rounded-pill bg-accent", view !== v.id && "invisible")} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto md:ml-0">
        <AccountCluster>
          <span className="hidden sm:block"><Button variant="secondary" size="sm" title="Partage : bientôt">Partager</Button></span>
        </AccountCluster>
      </div>
    </header>
  );
}
