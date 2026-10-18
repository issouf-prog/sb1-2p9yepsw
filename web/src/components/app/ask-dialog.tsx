"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AskOptions {
  title: string;
  label: string;
  initial?: string;
  confirm?: string;
  multiline?: boolean;
}

/** Modale de saisie (remplace window.prompt) : focus, Entrée valide, Échap annule. */
export function AskDialog({ opts, onDone }: { opts: AskOptions | null; onDone: (v: string | null) => void }) {
  return opts ? <AskInner key={opts.title + (opts.initial ?? "")} opts={opts} onDone={onDone} /> : null;
}

function AskInner({ opts, onDone }: { opts: AskOptions; onDone: (v: string | null) => void }) {
  const [value, setValue] = useState(opts.initial ?? "");
  const submit = () => value.trim() && onDone(value.trim());
  const field = "mt-1 w-full border border-border-input bg-surface px-3 outline-none focus:border-text";
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)} title={opts.title}>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="block">
          <span className="text-sm text-text-muted">{opts.label}</span>
          {opts.multiline ? (
            <textarea autoFocus value={value} rows={3} maxLength={500} onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} className={`${field} py-2`} />
          ) : (
            <input autoFocus value={value} maxLength={120} onChange={(e) => setValue(e.target.value)} className={`${field} h-10`} />
          )}
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onDone(null)}>Annuler</Button>
          <Button type="submit" disabled={!value.trim()}>{opts.confirm ?? "Valider"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
