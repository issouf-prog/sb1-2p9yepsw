import Link from "next/link";

const PLANS = [
  { name: "Gratuit", price: "0 €", credits: "300 à l'inscription" },
  { name: "Découverte", price: "5 €/mois", credits: "500 crédits" },
  { name: "Créateur", price: "20 €/mois", credits: "2 500 crédits" },
  { name: "Pro", price: "50 €/mois", credits: "8 000 crédits" },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-[var(--size-content-max)] px-4 pb-24 pt-16 sm:px-6">
      <h1 className="text-display">Tarifs</h1>
      <p className="mt-2 text-text-muted">Prix provisoires : /replica-launch les fixera.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <div key={p.name} className="border border-border bg-surface p-6">
            <h2 className="text-xl">{p.name}</h2>
            <p className="mt-4 text-2xl">{p.price}</p>
            <p className="mt-1 text-text-muted">{p.credits}</p>
          </div>
        ))}
      </div>
      <Link href="/projects" className="mt-10 inline-block underline">Retour au studio</Link>
    </main>
  );
}
