"use client";

import { Mic, Paperclip, StickyNote, RectangleHorizontal, ArrowUp } from "lucide-react";
import { useState } from "react";
import { IconButton } from "./icon-button";
import { cn } from "@/lib/cn";

/** Grande boîte de prompt de l'accueil. Entrée envoie, Maj+Entrée va à la ligne. Micro si vide, envoi sinon. */
export function PromptBox({ placeholder, styleLabel = "Aucun style", ratio = "16:9", onSubmit, className }: {
  placeholder: string;
  styleLabel?: string;
  ratio?: string;
  onSubmit?: (text: string) => void;
  className?: string;
}) {
  const [text, setText] = useState("");
  const send = () => text.trim() && onSubmit?.(text.trim());
  return (
    <div className={cn("w-full border border-border bg-surface focus-within:border-border-input", className)}>
      <label className="sr-only" htmlFor="prompt">Décrivez votre film</label>
      <textarea
        id="prompt"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        rows={3}
        className="block w-full resize-none bg-transparent px-5 pt-5 text-lg text-text outline-none placeholder:text-text-subtle"
      />
      <div className="flex items-center gap-1 px-3 pb-3">
        <IconButton label="Joindre un fichier" icon={<Paperclip className="size-5 text-text-muted" />} />
        <IconButton label="Ajouter une note" icon={<StickyNote className="size-5 text-text-muted" />} />
        <div className="ml-auto flex items-center gap-2">
          <button className="h-9 border border-dashed border-border-input px-3 text-sm uppercase tracking-wide text-text hover:bg-surface-sunken">
            {styleLabel}
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 border border-border px-3 text-sm text-text-muted hover:bg-surface-sunken">
            <RectangleHorizontal aria-hidden className="size-4" />
            {ratio}
            <span className="sr-only">format</span>
          </button>
          {text.trim() ? (
            <IconButton tone="round" label="Envoyer" icon={<ArrowUp className="size-5" />} onClick={send} />
          ) : (
            <IconButton tone="round" label="Dicter" icon={<Mic className="size-5" />} />
          )}
        </div>
      </div>
    </div>
  );
}
