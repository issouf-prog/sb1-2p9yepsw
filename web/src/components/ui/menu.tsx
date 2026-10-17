"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Menu déroulant (menu +, menu d'un nœud). Clavier et lecteur d'écran fournis par Radix. */
export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;
export const MenuSub = DM.Sub;

const panel = "z-50 min-w-60 rounded-sm border border-border bg-surface py-2 shadow-pop";
const row =
  "flex h-11 cursor-default select-none items-center gap-3 px-5 text-base text-text outline-none data-[highlighted]:bg-surface-sunken data-[disabled]:opacity-40";

export function MenuContent({ children, side = "right", align = "start" }: { children: ReactNode; side?: DM.DropdownMenuContentProps["side"]; align?: DM.DropdownMenuContentProps["align"] }) {
  return (
    <DM.Portal>
      <DM.Content side={side} align={align} sideOffset={8} className={panel}>
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function MenuItem({ icon, children, onSelect, disabled }: { icon?: ReactNode; children: ReactNode; onSelect?: () => void; disabled?: boolean }) {
  return (
    <DM.Item className={row} onSelect={onSelect} disabled={disabled}>
      {icon && <span aria-hidden className="text-text-muted [&>svg]:size-5">{icon}</span>}
      {children}
    </DM.Item>
  );
}

export function MenuSubTrigger({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <DM.SubTrigger className={cn(row, "data-[state=open]:bg-surface-sunken")}>
      {icon && <span aria-hidden className="text-text-muted [&>svg]:size-5">{icon}</span>}
      <span className="flex-1">{children}</span>
      <ChevronRight aria-hidden className="size-4 text-text-muted" />
    </DM.SubTrigger>
  );
}

export function MenuSubContent({ children }: { children: ReactNode }) {
  return (
    <DM.Portal>
      <DM.SubContent sideOffset={4} className={panel}>
        {children}
      </DM.SubContent>
    </DM.Portal>
  );
}

export function MenuSeparator() {
  return <DM.Separator className="mx-5 my-2 h-px bg-border" />;
}
