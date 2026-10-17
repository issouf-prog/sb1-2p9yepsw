"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { data, type Profile } from "@/lib/data";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopUpDialog } from "./topup-dialog";

interface AppCtx {
  me: Profile;
  openTopUp: () => void;
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

  useEffect(() => {
    data.me().then((p) => {
      if (!p) router.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      setMe(p);
    });
  }, [router]);

  if (!me) return <div className="min-h-dvh bg-bg" aria-busy="true" />;

  return (
    <TooltipProvider>
      <Ctx.Provider value={{ me, openTopUp: () => setTopUp(true) }}>
        {children}
        <TopUpDialog open={topUp} onOpenChange={setTopUp} />
      </Ctx.Provider>
    </TooltipProvider>
  );
}
