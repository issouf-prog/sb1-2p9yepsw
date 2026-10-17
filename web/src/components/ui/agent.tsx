import { CheckCircle2, XCircle, Loader2, ChevronRight, Image as ImageIcon, Play, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export type ActionStatus = "running" | "done" | "failed";

/** Carte d'action de l'agent. En échec : un message humain et une action proposée, jamais l'erreur technique. */
export function ActionCard({ label, status, detail, action }: { label: string; status: ActionStatus; detail?: string; action?: ReactNode }) {
  const Icon = status === "done" ? CheckCircle2 : status === "failed" ? XCircle : Loader2;
  return (
    <div
      role="status"
      className={cn(
        "flex w-fit max-w-full flex-col gap-2 rounded-sm px-3 py-2 text-sm",
        status === "failed" ? "bg-danger-surface text-danger" : "bg-surface-sunken text-text-muted",
      )}
    >
      <span className="inline-flex items-center gap-2">
        <Icon aria-hidden className={cn("size-4", status === "running" && "animate-spin")} />
        {label}
        <span className="sr-only">{status === "done" ? "terminé" : status === "failed" ? "échoué" : "en cours"}</span>
        {detail && status !== "failed" && <ChevronRight aria-hidden className="size-4" />}
      </span>
      {status === "failed" && detail && <span className="text-text">{detail}</span>}
      {status === "failed" && action}
    </div>
  );
}

/** Référence inline à un nœud ou une section : cliquer sélectionne le nœud sur la toile. */
export function AssetChip({ kind, label, onClick }: { kind: "image" | "video" | "section"; label: string; onClick?: () => void }) {
  const Icon = kind === "image" ? ImageIcon : kind === "video" ? Play : LayoutGrid;
  return (
    <button
      onClick={onClick}
      title={label}
      className="mx-0.5 inline-flex max-w-64 items-center gap-1.5 border border-border bg-surface px-2 py-0.5 align-baseline text-base hover:border-border-input"
    >
      <Icon aria-hidden className="size-4 shrink-0 text-text-muted" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function UserMessage({ children }: { children: ReactNode }) {
  return <div className="ml-auto max-w-[85%] border border-border-input bg-surface px-5 py-3 text-lg">{children}</div>;
}

export function AgentMessage({ children }: { children: ReactNode }) {
  return <div className="text-lg leading-8 text-text">{children}</div>;
}

export function TopUpButton() {
  return <Button variant="secondary" size="sm">Recharger mes crédits</Button>;
}
