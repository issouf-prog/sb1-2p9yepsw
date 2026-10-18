"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Modale : styles, voix, import, partage, export, pourboire, recharge. Focus piégé, Échap ferme. */
export function Dialog({ open, onOpenChange, title, description, children, trigger }: {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  trigger?: ReactNode;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-primary/30" />
        <D.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border bg-surface p-6 shadow-pop">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <D.Title className="text-xl">{title}</D.Title>
              {description && <D.Description className="mt-1 text-sm text-text-muted">{description}</D.Description>}
            </div>
            <D.Close aria-label="Fermer" className="rounded-pill p-2 text-text-muted hover:bg-surface-sunken hover:text-text">
              <X className="size-5" />
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
