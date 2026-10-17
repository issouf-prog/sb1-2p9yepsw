"use client";

import { useState } from "react";
import { Copy, Check, Lock, Users, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { data, type Project } from "@/lib/data";
import { cn } from "@/lib/cn";

const LINK = { none: "Désactivé", view: "Peut voir", edit: "Peut modifier" } as const;

/** Partage (S18). Simulé : les invitations ne partent pas encore par e-mail (Resend avec le backend). */
export function ShareDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invites = project.invites ?? [];
  const link = typeof window !== "undefined" ? `${location.origin}/p/${project.id}` : "";

  const invite = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setError("Adresse e-mail invalide.");
    if (invites.some((i) => i.email === e)) return setError("Cette personne est déjà invitée.");
    setError(null);
    await data.updateProject(project.id, { invites: [...invites, { email: e, access }] });
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Partager le projet" description="Mode développement : les invitations sont enregistrées mais aucun e-mail n'est envoyé.">
      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm text-text-muted">Visibilité dans votre espace</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["private", "shared"] as const).map((v) => (
              <button key={v} onClick={() => data.updateProject(project.id, { visibility: v })} aria-pressed={project.visibility === v}
                className={cn("flex items-center gap-2 border px-3 py-2 text-left", project.visibility === v ? "border-text" : "border-border hover:border-border-input")}>
                {v === "private" ? <Lock aria-hidden className="size-4" /> : <Users aria-hidden className="size-4" />}
                <span>{v === "private" ? "Privé (vous seul)" : "Partagé avec l'équipe"}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <form noValidate onSubmit={(e) => { e.preventDefault(); invite(); }}>
          <label htmlFor="invite" className="text-sm text-text-muted">Inviter par e-mail</label>
          <div className="mt-1 flex gap-2">
            <input id="invite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.fr"
              aria-invalid={!!error} aria-describedby={error ? "invite-err" : undefined}
              className="h-10 min-w-0 flex-1 border border-border-input px-3 outline-none focus:border-text" />
            <select aria-label="Droits" value={access} onChange={(e) => setAccess(e.target.value as "view" | "edit")} className="h-10 border border-border-input bg-surface px-2">
              <option value="view">Peut voir</option>
              <option value="edit">Peut modifier</option>
            </select>
            <Button type="submit">Inviter</Button>
          </div>
          {error && <p id="invite-err" role="alert" className="mt-1 text-sm text-danger">{error}</p>}
        </form>

        {invites.length > 0 && (
          <ul className="divide-y divide-border border border-border" aria-label="Personnes invitées">
            {invites.map((i) => (
              <li key={i.email} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate" title={i.email}>{i.email}</span>
                <span className="text-sm text-text-muted">{LINK[i.access]}</span>
                <IconButton label={`Retirer ${i.email}`} className="size-8" icon={<X className="size-4" />}
                  onClick={() => data.updateProject(project.id, { invites: invites.filter((x) => x.email !== i.email) })} />
              </li>
            ))}
          </ul>
        )}

        <div>
          <label htmlFor="link-access" className="text-sm text-text-muted">Toute personne ayant le lien</label>
          <div className="mt-1 flex gap-2">
            <select id="link-access" value={project.linkAccess ?? "none"} onChange={(e) => data.updateProject(project.id, { linkAccess: e.target.value as Project["linkAccess"] })}
              className="h-10 flex-1 border border-border-input bg-surface px-2">
              {Object.entries(LINK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Button variant="secondary" disabled={(project.linkAccess ?? "none") === "none"}
              onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}{copied ? "Copié" : "Copier le lien"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-text-muted">Conseil : « Peut voir » pour faire relire, « Peut modifier » seulement pour les co-auteurs.</p>
        </div>
      </div>
    </Dialog>
  );
}
