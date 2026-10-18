"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "./brand";
import { AccountCluster } from "./account-cluster";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/projects", label: "Accueil", match: (p: string, t: string | null) => p === "/projects" && t !== "all" },
  { href: "/projects?tab=all", label: "Projets", match: (p: string, t: string | null) => p === "/projects" && t === "all" },
  { href: "/tv", label: "Galerie", match: (p: string) => p.startsWith("/tv") },
  { href: "/references", label: "Références", match: (p: string) => p.startsWith("/references") },
];

/** Barre globale (S04b). */
export function GlobalHeader() {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="flex h-[var(--size-header)] items-center justify-between gap-4 px-4 sm:px-5">
        <Brand />
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-10">
            {TABS.map((t) => {
              const active = t.match(path, tab);
              return (
                <li key={t.href}>
                  <Link href={t.href} aria-current={active ? "page" : undefined}
                    className={cn("inline-flex items-center gap-2 text-nav uppercase", active ? "text-text" : "text-text-muted hover:text-text")}>
                    {t.label}
                    <span aria-hidden className={cn("size-1.5 rounded-pill bg-accent", !active && "invisible")} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <AccountCluster>
          <span className="hidden sm:block">
            <Button onClick={() => router.push("/projects#nouveau")}>
              <Plus aria-hidden className="size-4" />Créer
            </Button>
          </span>
        </AccountCluster>
      </div>
      <nav aria-label="Navigation principale (mobile)" className="flex justify-around border-t border-border md:hidden">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.match(path, tab) ? "page" : undefined}
            className={cn("py-2 text-xs uppercase tracking-wide", t.match(path, tab) ? "text-text" : "text-text-muted")}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
