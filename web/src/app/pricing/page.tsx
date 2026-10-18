"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/app/brand";
import { data } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import type { PlanId } from "@/lib/data/prices";
import { cn } from "@/lib/cn";

// Prix provisoires : /replica-launch les fixera.
const PLANS: { id: PlanId; name: string; price: string; credits: number; perks: string[] }[] = [
  { id: "free", name: "Gratuit", price: "0 €", credits: 0, perks: ["300 crédits à l'inscription", "Modèles rapides et qualité", "Export 720p avec filigrane"] },
  { id: "casual", name: "Découverte", price: "5 €/mois", credits: 500, perks: ["500 crédits par mois", "Agent illimité", "Export avec filigrane"] },
  { id: "standard", name: "Créateur", price: "20 €/mois", credits: 2500, perks: ["2 500 crédits par mois", "Personnage de référence", "Modèle image Pro (4K)", "Export sans filigrane"] },
  { id: "pro", name: "Pro", price: "50 €/mois", credits: 8000, perks: ["8 000 crédits par mois", "Tous les modèles, dont vidéo Cinéma", "Support prioritaire"] },
];

export default function PricingPage() {
  const router = useRouter();
  const ws = useLive(() => data.workspace(), []);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const current = ws.value?.plan;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface px-5 py-4"><Brand /></header>
      <main className="mx-auto max-w-[var(--size-content-max)] px-4 pb-24 pt-16 sm:px-6">
        <h1 className="text-2xl sm:text-display">Tarifs</h1>
        <p className="mt-2 text-text-muted">Paiement simulé pendant le développement : choisir un plan l&apos;active immédiatement et ajoute ses crédits.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <section key={p.id} aria-labelledby={`plan-${p.id}`} className={cn("flex flex-col border bg-surface p-6", current === p.id ? "border-text" : "border-border")}>
              <h2 id={`plan-${p.id}`} className="text-xl">{p.name}</h2>
              <p className="mt-4 text-2xl">{p.price}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.perks.map((x) => <li key={x} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0" />{x}</li>)}
              </ul>
              {current === p.id ? (
                <p className="mt-6 text-center text-sm text-text-muted">Votre plan actuel</p>
              ) : p.id !== "free" ? (
                <Button className="mt-6" loading={busy === p.id} disabled={!ws.value}
                  onClick={async () => { setBusy(p.id); await data.choosePlan(p.id, p.credits); setBusy(null); router.back(); }}>
                  Choisir {p.name}
                </Button>
              ) : null}
            </section>
          ))}
        </div>
        <Link href="/projects" className="mt-10 inline-block underline">Retour au studio</Link>
      </main>
    </div>
  );
}
