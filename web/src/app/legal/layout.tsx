import Link from "next/link";
import { Brand } from "@/components/app/brand";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface px-5 py-4"><Brand /></header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="mb-8 border border-border bg-highlight/50 px-4 py-3 text-sm">
          Modèle de travail rédigé pour ce projet. À faire relire par un juriste avant la mise en ligne
          (/replica-deploy le vérifie).
        </p>
        <article className="story-prose">{children}</article>
        <nav className="mt-12 flex gap-6 text-sm text-text-muted" aria-label="Pages légales">
          <Link href="/legal/cgu" className="underline">Conditions d&apos;utilisation</Link>
          <Link href="/legal/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/projects" className="underline">Retour au studio</Link>
        </nav>
      </main>
    </div>
  );
}
