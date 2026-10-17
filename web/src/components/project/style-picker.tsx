"use client";

import { useRef, useState } from "react";
import { Check, Upload, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { data, type Style } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { placeholderImage } from "@/lib/gen/provider";
import { fileToNode } from "@/lib/upload";
import { cn } from "@/lib/cn";

/** Catalogue de styles (S05) et création d'un style perso à partir d'images (S06). */
export function StylePicker({ open, onOpenChange, value, onPick }: {
  open: boolean; onOpenChange: (o: boolean) => void; value: string | null; onPick: (s: Style | null) => void;
}) {
  const styles = useLive(() => data.listStyles(), []);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const list = (styles.value ?? []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  const addFiles = async (files: FileList | null) => {
    setErr(null);
    for (const f of Array.from(files ?? []).slice(0, 5 - refs.length)) {
      const r = await fileToNode(f);
      if (!r.ok) setErr(r.error);
      else if (r.node.type === "image") setRefs((x) => [...x, r.node.data.mediaUrl!].slice(0, 5));
      else setErr("Les références de style doivent être des images.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={creating ? "Créer mon style" : "Styles visuels"}
      description={creating ? "1 à 5 images qui montrent le rendu voulu. Le style s'applique à toutes les générations du projet." : "Le style choisi est ajouté à chaque prompt d'image et de vidéo du projet."}>
      {creating ? (
        <form onSubmit={async (e) => { e.preventDefault(); if (!name.trim() || !refs.length) return; const s = await data.createStyle({ name: name.trim(), referenceUrls: refs }); onPick(s); setCreating(false); setName(""); setRefs([]); }}>
          <label className="block">
            <span className="text-sm text-text-muted">Nom du style</span>
            <input autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="mt-1 h-10 w-full border border-border-input px-3 outline-none focus:border-text" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            {refs.map((u, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Référence ${i + 1}`} className="size-20 object-cover" />
                <IconButton label={`Retirer la référence ${i + 1}`} className="absolute -right-2 -top-2 size-6 bg-surface" icon={<X className="size-3" />} onClick={() => setRefs((r) => r.filter((_, k) => k !== i))} />
              </div>
            ))}
            {refs.length < 5 && (
              <button type="button" onClick={() => file.current?.click()} className="flex size-20 flex-col items-center justify-center gap-1 border border-dashed border-border-input text-xs text-text-muted hover:text-text">
                <Upload aria-hidden className="size-5" />Ajouter
              </button>
            )}
            <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Retour</Button>
            <Button type="submit" disabled={!name.trim() || !refs.length}>Créer le style</Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            <input aria-label="Rechercher un style" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 min-w-0 flex-1 border border-border-input px-3 outline-none focus:border-text" />
            <Button variant="secondary" onClick={() => setCreating(true)}>Créer mon style</Button>
          </div>
          <ul className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3" aria-label="Styles">
            <li>
              <button onClick={() => onPick(null)} aria-pressed={value === null} className={cn("flex aspect-[4/3] w-full items-center justify-center border text-base", value === null ? "border-text" : "border-border hover:border-border-input")}>
                Aucun style
              </button>
            </li>
            {list.map((s) => (
              <li key={s.id}>
                <button onClick={() => onPick(s)} aria-pressed={value === s.id} title={s.promptSuffix}
                  className={cn("relative block w-full border text-left", value === s.id ? "border-text" : "border-border hover:border-border-input")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.referenceUrls[0] ?? placeholderImage(s.promptSuffix, "4:3", s.name, s.id).url} alt="" className="aspect-[4/3] w-full object-cover" />
                  <span className="block truncate px-2 py-1.5 text-sm">{s.name}{s.workspaceId ? " · perso" : ""}</span>
                  {value === s.id && <Check aria-hidden className="absolute right-2 top-2 size-5 rounded-pill bg-surface p-0.5" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}
