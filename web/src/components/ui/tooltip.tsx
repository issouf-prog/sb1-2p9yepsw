"use client";

import * as RT from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RT.Provider delayDuration={400}>{children}</RT.Provider>;
}

export function Tooltip({ content, children, side = "right" }: { content: ReactNode; children: ReactNode; side?: RT.TooltipContentProps["side"] }) {
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content side={side} sideOffset={6} className="z-50 rounded-sm bg-primary px-2 py-1 text-xs text-on-primary shadow-pop">
          {content}
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}
