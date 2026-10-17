"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { data } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { IconButton } from "@/components/ui/icon-button";
import { CreditBadge, Avatar } from "@/components/ui/credit-badge";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/menu";
import { useApp } from "./app-context";

/** Cloche, solde de crédits et menu du compte (partagés par la barre globale et la barre projet). */
export function AccountCluster({ children }: { children?: React.ReactNode }) {
  const { me, openTopUp } = useApp();
  const router = useRouter();
  const ws = useLive(() => data.workspace(), []);
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <IconButton label="Notifications" icon={<Bell className="size-5" />} />
      {children}
      {ws.value && <CreditBadge balance={ws.value.creditBalance} onClick={openTopUp} />}
      <Menu>
        <MenuTrigger asChild>
          <button aria-label={`Compte de ${me.name}`} className="rounded-pill">
            <Avatar name={me.name} />
          </button>
        </MenuTrigger>
        <MenuContent side="bottom" align="end">
          <div className="px-5 pb-2 pt-1 text-sm text-text-muted">{me.email}</div>
          <MenuItem icon={<LogOut />} onSelect={async () => { await data.signOut(); router.replace("/login"); }}>
            Se déconnecter
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
