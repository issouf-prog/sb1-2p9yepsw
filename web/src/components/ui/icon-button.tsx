import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Tooltip } from "./tooltip";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Libellé accessible, aussi affiché en infobulle. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  tone?: "default" | "solid" | "round";
  shortcut?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, active, tone = "default", shortcut, className, ...props },
  ref,
) {
  return (
    <Tooltip content={shortcut ? `${label} (${shortcut})` : label}>
      <button
        ref={ref}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "inline-flex size-10 items-center justify-center transition-colors duration-fast",
          "disabled:pointer-events-none disabled:opacity-40",
          tone === "solid" && "rounded-lg bg-primary text-on-primary hover:bg-primary/90",
          tone === "round" && "rounded-pill bg-primary text-on-primary hover:bg-primary/90 size-12",
          tone === "default" && "rounded-pill text-text hover:bg-surface-sunken",
          tone === "default" && active && "bg-surface-sunken",
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
});
