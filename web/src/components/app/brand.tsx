import Link from "next/link";
import { Clapperboard } from "lucide-react";

/** Logo provisoire (le vrai nom et logo viendront de /replica-brand). */
export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/projects" className="inline-flex items-center gap-2 text-xl font-medium text-text" aria-label="Studio, accueil">
      <Clapperboard aria-hidden className="size-6" />
      {!compact && <span>Studio</span>}
    </Link>
  );
}
