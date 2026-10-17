import { cn } from "@/lib/cn";

/** Bascule segmentée (Scène / Caméras, 3D / 2D). Radiogroup clavier : flèches gauche/droite. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-sm bg-surface-sunken p-0.5">
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (d) onChange(options[(i + d + options.length) % options.length].value);
            }}
            className={cn("h-9 rounded-sm px-5 text-base transition-colors duration-fast", checked ? "bg-border text-text" : "text-text-muted hover:text-text")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
