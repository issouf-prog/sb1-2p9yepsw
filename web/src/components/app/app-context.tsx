"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { data, type Profile } from "@/lib/data";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopUpDialog } from "./topup-dialog";
import { AskDialog, type AskOptions } from "./ask-dialog";

interface AppCtx {
  me: Profile;
  openTopUp: () => void;
  /** Demande une saisie à l'utilisateur ; null s'il annule. */
  ask: (opts: AskOptions) => Promise<string | null>;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp hors de AppProvider");
  return c;
}

/** Garde d'authentification + services communs (recharge). */
export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Profile | null | undefined>(undefined);
  const [topUp, setTopUp] = useState(false);
  const [askOpts, setAskOpts] = useState<AskOptions | null>(null);
  const resolver = useRef<((v: string | null) => void) | null>(null);
  const ask = useCallback((opts: AskOptions) => new Promise<string | null>((resolve) => {
    resolver.current = resolve;
    setAskOpts(opts);
  }), []);

  useEffect(() => {
    data.me().then((p) => {
      if (!p) router.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      setMe(p);
    });
  }, [router]);

  if (!me) return <div className="min-h-dvh bg-bg" aria-busy="true" />;

  return (
    <TooltipProvider>
      <Ctx.Provider value={{ me, openTopUp: () => setTopUp(true), ask }}>
        {children}
        <TopUpDialog open={topUp} onOpenChange={setTopUp} />
        <AskDialog opts={askOpts} onDone={(v) => { setAskOpts(null); resolver.current?.(v); resolver.current = null; }} />
      </Ctx.Provider>
    </TooltipProvider>
  );
}
