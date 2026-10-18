import { cn } from "@/lib/cn";

export interface NavTab {
  id: string;
  label: string;
}

/** Onglets en capitales espacées ; l'actif porte un point d'accent (barre globale, onglets du projet). */
export function NavTabs({ tabs, active, onChange, label }: { tabs: NavTab[]; active: string; onChange?: (id: string) => void; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-10">
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <button
                aria-current={isActive ? "page" : undefined}
                onClick={() => onChange?.(t.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 text-nav uppercase transition-colors duration-fast",
                  isActive ? "text-text" : "text-text-muted hover:text-text",
                )}
              >
                {t.label}
                <span aria-hidden className={cn("size-1.5 rounded-pill bg-accent", !isActive && "invisible")} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
