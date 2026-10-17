"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { data, type Project } from "@/lib/data";

export function ProjectMenu({ project }: { project: Project }) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(project.name);
  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button aria-label={`Actions sur ${project.name}`} className="rounded-pill p-2 text-text-muted hover:bg-surface-sunken hover:text-text">
            <MoreHorizontal className="size-5" />
          </button>
        </MenuTrigger>
        <MenuContent side="bottom" align="end">
          <MenuItem icon={<Pencil />} onSelect={() => setRenaming(true)}>Renommer</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash2 />} onSelect={() => setDeleting(true)}>Supprimer</MenuItem>
        </MenuContent>
      </Menu>
      <Dialog open={renaming} onOpenChange={setRenaming} title="Renommer le projet">
        <form onSubmit={async (e) => { e.preventDefault(); if (name.trim()) { await data.updateProject(project.id, { name: name.trim() }); setRenaming(false); } }}>
          <label className="block">
            <span className="sr-only">Nom du projet</span>
            <input autoFocus value={name} maxLength={120} onChange={(e) => setName(e.target.value)} className="h-10 w-full border border-border-input px-3 outline-none focus:border-text" />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRenaming(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={deleting} onOpenChange={setDeleting} title="Supprimer ce projet ?" description={`« ${project.name} » et tous ses plans seront supprimés. Cette action est définitive.`}>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(false)}>Annuler</Button>
          <Button variant="danger" onClick={async () => { await data.deleteProject(project.id); setDeleting(false); }}>Supprimer</Button>
        </div>
      </Dialog>
    </>
  );
}
