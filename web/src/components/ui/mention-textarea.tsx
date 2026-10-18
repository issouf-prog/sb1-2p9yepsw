"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type TextareaHTMLAttributes } from "react";
import { Image as ImageIcon, Play, AudioLines } from "lucide-react";
import type { CanvasNode } from "@/lib/data";
import { cn } from "@/lib/cn";

/** Zone de texte avec autocomplétion @ : taper @ propose les plans du projet ; Entrée ou clic insère « @Nom ». */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, {
  value: string;
  onValueChange: (v: string) => void;
  nodes: CanvasNode[];
  onEnter?: () => void;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">>(function MentionTextarea({ value, onValueChange, nodes, onEnter, className, ...rest }, ref) {
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => area.current!);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const media = useMemo(() => nodes.filter((n) => ["image", "video", "audio"].includes(n.type) && n.data.mediaUrl && !n.data.archived), [nodes]);
  const matches = query === null ? [] : media.filter((n) => n.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const listId = useMemo(() => `mentions-${Math.random().toString(36).slice(2)}`, []);

  const detect = (v: string, caret: number) => {
    const m = v.slice(0, caret).match(/(^|\s)@([^\s@]{0,30})$/);
    setQuery(m ? m[2] : null);
    setActive(0);
  };
  const insert = (n: CanvasNode) => {
    const el = area.current!;
    const caret = el.selectionStart;
    const before = value.slice(0, caret).replace(/@([^\s@]{0,30})$/, `@${n.name.replace(/\s+/g, "_")} `);
    const next = before + value.slice(caret);
    onValueChange(next);
    setQuery(null);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(before.length, before.length); });
  };

  return (
    <div className="relative">
      <textarea
        ref={area}
        value={value}
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => { onValueChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (matches.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % matches.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insert(matches[active]); return; }
            if (e.key === "Escape") { e.preventDefault(); setQuery(null); return; }
          }
          if (e.key === "Enter" && !e.shiftKey && onEnter) { e.preventDefault(); onEnter(); }
        }}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
        className={className}
        {...rest}
      />
      {matches.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Plans à citer" className="absolute bottom-full left-0 z-50 mb-1 max-h-60 w-72 overflow-y-auto border border-border bg-surface py-1 shadow-pop">
          {matches.map((n, i) => {
            const Icon = n.type === "video" ? Play : n.type === "audio" ? AudioLines : ImageIcon;
            return (
              <li key={n.id} role="option" aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); insert(n); }}
                className={cn("flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm", i === active && "bg-surface-sunken")}>
                <Icon aria-hidden className="size-4 shrink-0 text-text-muted" />
                <span className="truncate" title={n.name}>{n.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

/** Plans cités dans un texte (« @Nom_du_plan »). */
export function mentionedNodes(text: string, nodes: CanvasNode[]): CanvasNode[] {
  const names = [...text.matchAll(/@([^\s@]+)/g)].map((m) => m[1].toLowerCase());
  return nodes.filter((n) => names.includes(n.name.replace(/\s+/g, "_").toLowerCase()));
}
