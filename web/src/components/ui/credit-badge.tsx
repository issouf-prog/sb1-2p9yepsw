import { cn } from "@/lib/cn";

/** Solde de crédits de la barre du haut. Passe en alerte sous le seuil. */
export function CreditBadge({ balance, low = 50, onClick }: { balance: number; low?: number; onClick?: () => void }) {
  const isLow = balance < low;
  return (
    <button onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-sm px-2 text-lg text-text-muted hover:bg-surface-sunken">
      <span aria-hidden className={cn("size-2.5 rounded-pill", isLow ? "bg-danger" : "bg-accent")} />
      <span className="tabular-nums">{balance.toLocaleString("fr-FR")}</span>
      <span className="sr-only">crédits{isLow ? ", solde bas" : ""}</span>
    </button>
  );
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className="rounded-pill object-cover" />
  ) : (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-pill bg-success text-on-primary"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
