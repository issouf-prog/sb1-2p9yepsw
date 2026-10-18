"use client";

import { Mic, Paperclip, StickyNote, RectangleHorizontal, ArrowUp, Check } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { IconButton } from "./icon-button";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "./menu";
import { cn } from "@/lib/cn";

export const RATIOS = ["16:9", "9:16", "1:1", "21:9", "4:3", "3:4", "5:4"] as const;
export type Ratio = (typeof RATIOS)[number];

export interface PromptBoxHandle {
  focus: () => void;
  setText: (t: string) => void;
}

/** Grande boîte de prompt de l'accueil. Entrée envoie, Maj+Entrée va à la ligne. Micro si vide, envoi sinon. */
export const PromptBox = forwardRef<PromptBoxHandle, {
  placeholder: string;
  styleLabel?: string;
  ratio?: Ratio;
  onRatioChange?: (r: Ratio) => void;
  onStyleClick?: () => void;
  onSubmit?: (text: string) => void;
  busy?: boolean;
  className?: string;
}>(function PromptBox({ placeholder, styleLabel = "Aucun style", ratio = "16:9", onRatioChange, onStyleClick, onSubmit, busy, className }, ref) {
  const [text, setText] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus(), setText: (t) => { setText(t); area.current?.focus(); } }));
  const send = () => !busy && text.trim() && onSubmit?.(text.trim());
  return (
    <div className={cn("w-full border border-border bg-surface focus-within:border-border-input", className)}>
      <label className="sr-only" htmlFor="prompt">Décrivez votre film</label>
      <textarea
        ref={area}
        id="prompt"
        value={text}
        maxLength={4000}
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
        <IconButton label="Joindre un fichier (bientôt)" aria-disabled icon={<Paperclip className="size-5 text-text-muted" />} />
        <IconButton label="Ajouter une note (bientôt)" aria-disabled icon={<StickyNote className="size-5 text-text-muted" />} />
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onStyleClick} className="hidden h-9 max-w-48 truncate border border-dashed border-border-input px-3 text-sm uppercase tracking-wide text-text hover:bg-surface-sunken sm:block">
            {styleLabel}<span className="sr-only"> : choisir un style</span>
          </button>
          <Menu>
            <MenuTrigger asChild>
              <button type="button" className="inline-flex h-9 items-center gap-1.5 border border-border px-3 text-sm text-text-muted hover:bg-surface-sunken">
                <RectangleHorizontal aria-hidden className="size-4" />
                {ratio}
                <span className="sr-only">: format de l&apos;image, modifier</span>
              </button>
            </MenuTrigger>
            <MenuContent side="bottom" align="end">
              {RATIOS.map((r) => (
                <MenuItem key={r} onSelect={() => onRatioChange?.(r)} icon={r === ratio ? <Check /> : <span className="inline-block size-5" />}>{r}</MenuItem>
              ))}
            </MenuContent>
          </Menu>
          {text.trim() ? (
            <IconButton tone="round" label="Envoyer" disabled={busy} icon={<ArrowUp className="size-5" />} onClick={send} />
          ) : (
            <IconButton tone="round" label="Dicter (bientôt)" aria-disabled icon={<Mic className="size-5" />} />
          )}
        </div>
      </div>
    </div>
  );
});
