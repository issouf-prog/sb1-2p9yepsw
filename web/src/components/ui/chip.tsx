import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Pilule à bord fin : raccourcis de démarrage (accueil) et suggestions de l'agent. */
export function Chip({ className, size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center truncate rounded-pill border border-border bg-surface text-text",
        "transition-colors duration-fast hover:border-border-input hover:bg-surface-sunken",
        size === "md" ? "h-14 px-6 text-base" : "h-8 px-3 text-sm text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
