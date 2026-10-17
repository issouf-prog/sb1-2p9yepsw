"use client";

import { ChevronDown, Heart, Archive, Pencil, Download, Maximize2, CopyPlus, X, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";
import { Thumb } from "./cards";

/** Barre d'outils verticale flottante de la toile. */
export function VerticalToolbar({ children, zoom }: { children: React.ReactNode; zoom: number }) {
  return (
    <div role="toolbar" aria-orientation="vertical" aria-label="Outils de la toile" className="flex w-14 flex-col items-center gap-1 rounded-lg border border-border bg-surface py-3 shadow-toolbar">
      <span aria-hidden className="mb-1 text-text-subtle">⋮⋮</span>
      {children}
      <span className="mt-2 text-sm tabular-nums text-text-muted">{zoom} %</span>
    </div>
  );
}

export function ToolbarDivider() {
  return <span aria-hidden className="my-1 h-px w-8 bg-border" />;
}

/** En-tête de section : repliable, nom complet en infobulle. */
export function SectionHeader({ name, collapsed, onToggle }: { name: string; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      title={name}
      className="inline-flex max-w-96 items-center gap-2 border border-border bg-surface px-4 py-2 text-lg hover:border-border-input"
    >
      <ChevronDown aria-hidden className={cn("size-5 transition-transform duration-fast", collapsed && "-rotate-90")} />
      <span className="truncate">{name}</span>
    </button>
  );
}

/** Nœud média sélectionné : barre flottante, média, dimensions, prompt surligné éditable. */
export function MediaNode({ title, width, height, prompt, selected = true }: { title: string; width: number; height: number; prompt: string; selected?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-flex flex-col items-start gap-2">
      {selected && (
        <div role="toolbar" aria-label={`Actions sur ${title}`} className="flex items-center gap-0.5 border border-border bg-surface px-1 shadow-toolbar">
          <IconButton label="Favori" icon={<Heart className="size-4" />} className="size-8" />
          <IconButton label="Archiver" icon={<Archive className="size-4" />} className="size-8" />
          <span className="mx-1 max-w-52 truncate text-base" title={title}>{title}</span>
          <IconButton label="Renommer" icon={<Pencil className="size-4 text-text-muted" />} className="size-8" />
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <IconButton label="Télécharger" icon={<Download className="size-4" />} className="size-8" />
          <IconButton label="Plein écran" icon={<Maximize2 className="size-4" />} className="size-8" />
          <IconButton label="Dupliquer" icon={<CopyPlus className="size-4" />} className="size-8" />
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <IconButton label="Désélectionner" icon={<X className="size-4" />} className="size-8" />
        </div>
      )}
      <div className={cn("w-60 border bg-surface", selected ? "border-text" : "border-border")}>
        <Thumb seed={title} className="aspect-[9/16]" />
        <p className="px-2 pt-1 text-right text-sm tabular-nums text-text-muted">{width} × {height} px</p>
        <div className="flex items-start gap-2 px-2 pb-2">
          <p className={cn("flex-1 text-base", !open && "line-clamp-3")}>
            <mark className="bg-highlight text-text">{prompt}</mark>
          </p>
          <IconButton label="Copier le prompt" icon={<Copy className="size-4 text-text-muted" />} className="size-7" />
        </div>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="px-2 pb-2 text-sm text-text-muted hover:text-text">
          {open ? "Voir moins" : "Voir tout"}
        </button>
      </div>
    </div>
  );
}
