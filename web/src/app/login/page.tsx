"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/app/brand";
import { data } from "@/lib/data";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/projects";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async (n: string, e: string) => {
    setBusy(true);
    await data.signIn(n, e);
    router.replace(next.startsWith("/") ? next : "/projects");
  };
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm border border-border bg-surface p-8">
        <Brand />
        <h1 className="mt-6 text-2xl">Entrez dans votre studio</h1>
        <p className="mt-2 text-text-muted">300 crédits offerts pour vos premiers plans.</p>
        <Button className="mt-6 w-full" variant="secondary" loading={busy} onClick={() => go("Vous", "vous@exemple.fr")}>
          Continuer avec Google (simulé)
        </Button>
        <div className="my-6 flex items-center gap-3 text-sm text-text-muted"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && email.includes("@")) go(name.trim(), email.trim()); }} className="space-y-3">
          <label className="block">
            <span className="text-sm">Nom</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1 h-10 w-full border border-border-input bg-surface px-3 outline-none focus:border-text" />
          </label>
          <label className="block">
            <span className="text-sm">E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 h-10 w-full border border-border-input bg-surface px-3 outline-none focus:border-text" />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>Recevoir un lien de connexion</Button>
        </form>
        <p className="mt-6 text-xs text-text-muted">Mode développement : la connexion est simulée et vos données restent dans ce navigateur.</p>
        <p className="mt-3 text-xs text-text-muted">En continuant, vous acceptez les <a href="/legal/cgu" className="underline">conditions d&apos;utilisation</a> et la <a href="/legal/confidentialite" className="underline">politique de confidentialité</a>.</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
