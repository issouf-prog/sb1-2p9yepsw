"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { data } from "@/lib/data";
import { cn } from "@/lib/cn";

const PACKS = [
  { credits: 500, price: "5 €" },
  { credits: 2500, price: "20 €" },
  { credits: 8000, price: "50 €" },
];

/** Recharge de crédits. Simulée : Stripe Checkout la remplacera (/api/billing/checkout). */
export function TopUpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pick, setPick] = useState(0);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Recharger mes crédits" description="Paiement simulé : aucun moyen de paiement n'est demandé pendant le développement.">
      <fieldset className="grid gap-2">
        <legend className="sr-only">Choisir un pack</legend>
        {PACKS.map((p, i) => (
          <label key={p.credits} className={cn("flex cursor-pointer items-center justify-between border px-4 py-3", pick === i ? "border-text" : "border-border hover:border-border-input")}>
            <span className="flex items-center gap-3">
              <input type="radio" name="pack" checked={pick === i} onChange={() => setPick(i)} className="accent-[var(--color-primary)]" />
              <span className="text-lg tabular-nums">{p.credits.toLocaleString("fr-FR")} crédits</span>
            </span>
            <span className="text-text-muted">{p.price}</span>
          </label>
        ))}
      </fieldset>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await data.topUp(PACKS[pick].credits);
            setBusy(false);
            onOpenChange(false);
          }}
        >
          Ajouter {PACKS[pick].credits.toLocaleString("fr-FR")} crédits
        </Button>
      </div>
    </Dialog>
  );
}
