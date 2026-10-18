import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2, Lock, Coins } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Coût en crédits affiché à droite du libellé (bouton Lancer). */
  cost?: number;
  /** Modèle hors plan : le bouton propose de passer au plan supérieur. */
  locked?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/80",
  secondary: "bg-surface text-text border border-border hover:border-border-input hover:bg-surface-sunken",
  ghost: "bg-transparent text-text hover:bg-surface-sunken",
  danger: "bg-danger text-on-primary hover:bg-danger/90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-base gap-2",
  lg: "h-12 px-5 text-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, cost, locked, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap rounded-sm font-normal",
        "transition-colors duration-fast ease-out disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : locked ? <Lock aria-hidden className="size-4" /> : null}
      <span className="inline-flex items-center gap-[inherit]">{locked ? "Passer au plan supérieur" : children}</span>
      {cost !== undefined && !locked && (
        <span className="ml-1 inline-flex items-center gap-1 border-l border-current/25 pl-2 tabular-nums opacity-80">
          <Coins aria-hidden className="size-3.5" />
          {cost}
          <span className="sr-only">crédits</span>
        </span>
      )}
    </button>
  );
});
