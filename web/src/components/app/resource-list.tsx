"use client";

import { ChevronDown, Crosshair, Heart, Mic, Music, Plus, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import type { CanvasNode, Section } from "@/lib/data";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

/** Liste des ressources du projet groupées par section (S13, et panneau gauche du montage). */
export function ResourceList({ nodes, sections, selected, onPick, onAdd, onLocateSection, onRestore }: {
  nodes: CanvasNode[];
  sections: Section[];
  selected?: Set<string>;
  onPick?: (n: CanvasNode) => void;
  onAdd?: (n: CanvasNode) => void;
  onLocateSection?: (id: string) => void;
  /** Restaurer un plan archivé (affiche le filtre Archivés). */
  onRestore?: (n: CanvasNode) => void;
}) {
  const [filter, setFilter] = useState<"all" | "fav" | "archived">("all");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const withMedia = nodes.filter((n) => ["image", "video", "audio"].includes(n.type) && n.data.mediaUrl);
  const all = withMedia.filter((n) => !n.data.archived);
  const archived = withMedia.filter((n) => n.data.archived);
  const media = filter === "archived" ? archived : all.filter((n) => filter === "all" || n.data.favorite);
  const groups = [
    ...sections.map((s) => ({ id: s.id, name: s.name, items: media.filter((n) => n.sectionId === s.id) })),
    { id: "none", name: "Non groupés", items: media.filter((n) => !n.sectionId || !sections.some((s) => s.id === n.sectionId)) },
  ].filter((g) => g.items.length);
  const toggle = (id: string) => setClosed((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-4 border-b border-border px-4 py-2 text-base">
        <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={filter === "all" ? "text-text" : "text-text-muted"}>Tout {all.length}</button>
        <button onClick={() => setFilter("fav")} aria-pressed={filter === "fav"} className={filter === "fav" ? "text-text" : "text-text-muted"}>Favoris {all.filter((n) => n.data.favorite).length}</button>
        {onRestore && <button onClick={() => setFilter("archived")} aria-pressed={filter === "archived"} className={filter === "archived" ? "text-text" : "text-text-muted"}>Archivés {archived.length}</button>}
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {groups.length === 0 && (
          <p className="px-4 py-6 text-sm text-text-muted">{filter === "fav" ? "Aucun favori. Ajoutez-en avec le cœur d'un plan." : filter === "archived" ? "Aucun plan archivé." : "Aucun plan généré pour l'instant."}</p>
        )}
        {groups.map((g) => (
          <div key={g.id} className="mb-1">
            <div className="flex items-center gap-1 px-2">
              <button onClick={() => toggle(g.id)} aria-expanded={!closed.has(g.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-base text-text-muted hover:text-text">
                <ChevronDown aria-hidden className={cn("size-4 shrink-0 transition-transform", closed.has(g.id) && "-rotate-90")} />
                <span className="truncate" title={g.name}>{g.name}</span>
              </button>
              {g.id !== "none" && onLocateSection && (
                <IconButton label={`Voir la section ${g.name} sur la toile`} className="size-8" icon={<Crosshair className="size-4 text-text-muted" />} onClick={() => onLocateSection(g.id)} />
              )}
              <span className="px-2 text-sm text-text-muted">{g.items.length}</span>
            </div>
            {!closed.has(g.id) && (
              <ul>
                {g.items.map((n) => (
                  <li key={n.id} className={cn("flex items-center gap-3 px-4 py-1.5 hover:bg-surface-sunken", selected?.has(n.id) && "bg-surface-sunken")}>
                    <button onClick={() => onPick?.(n)} disabled={!onPick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      {n.type === "audio" ? (
                        <span className="flex size-12 shrink-0 items-center justify-center bg-surface-sunken">
                          {n.data.action === "generate_music" ? <Music aria-hidden className="size-5 text-text-muted" /> : <Mic aria-hidden className="size-5 text-text-muted" />}
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.data.posterUrl ?? n.data.mediaUrl} alt="" className="size-12 shrink-0 object-cover" />
                      )}
                      <span className="min-w-0 flex-1 truncate" title={n.name}>{n.name}</span>
                    </button>
                    {n.data.favorite && <Heart aria-label="Favori" className="size-4 shrink-0 fill-current text-text-muted" />}
                    {(n.type === "video" || n.type === "audio") && <span className="shrink-0 text-sm text-text-muted">{((n.data.durationMs ?? 0) / 1000).toFixed(0)} s</span>}
                    {filter === "archived" && onRestore && <IconButton label={`Restaurer ${n.name} sur la toile`} className="size-8 shrink-0" icon={<ArchiveRestore className="size-4" />} onClick={() => onRestore(n)} />}
                    {onAdd && filter !== "archived" && <IconButton label={`Ajouter ${n.name} au montage`} className="size-8 shrink-0" icon={<Plus className="size-4" />} onClick={() => onAdd(n)} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
