"use client";

import { ReactFlowProvider } from "@xyflow/react";
import Link from "next/link";
import { use, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { data } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { ProjectHeader, VIEWS, type View } from "@/components/project/project-header";
import { Canvas } from "@/components/project/canvas";
import { AgentPanel } from "@/components/project/agent-panel";
import { StoryView } from "@/components/story/story-view";
import { EditorView } from "@/components/editor/editor-view";
import { GuidedTour } from "@/components/app/guided-tour";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const PLANNED = {
  stage: { title: "Plateau 3D", text: "Placer personnages et caméras, répéter, enregistrer une prise de référence. Prévu en phase 4." },
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const viewParam = useSearchParams().get("view");
  const view: View = VIEWS.some((v) => v.id === viewParam) ? (viewParam as View) : "canvas";
  const project = useLive(() => data.getProject(id), [id], id);
  const canvas = useLive(() => data.canvas(id), [id], id);
  const [selection, setSelection] = useState<string[]>([]);
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [mobilePane, setMobilePane] = useState<"canvas" | "agent">("canvas");
  const onSel = useCallback((ids: string[]) => setSelection(ids), []);

  if (project.loading || canvas.loading) return <div className="h-dvh bg-canvas" aria-busy="true" />;
  if (!project.value) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <h1 className="text-2xl">Projet introuvable</h1>
        <p className="text-text-muted">Il a peut-être été supprimé, ou vous n&apos;y avez pas accès.</p>
        <Link href="/projects"><Button>Retour à l&apos;accueil</Button></Link>
      </main>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-dvh flex-col">
        <GuidedTour view={view} />
        <ProjectHeader project={project.value} view={view} />
        <div className="flex border-b border-border bg-surface lg:hidden" role="tablist" aria-label="Panneau affiché">
          {(["canvas", "agent"] as const).map((p) => (
            <button key={p} role="tab" aria-selected={mobilePane === p} onClick={() => setMobilePane(p)}
              className={cn("flex-1 py-2 text-sm uppercase tracking-wide", mobilePane === p ? "text-text" : "text-text-muted")}>
              {p === "canvas" ? "Toile" : "Agent"}
            </button>
          ))}
        </div>
        <div className="flex min-h-0 flex-1">
          <main className={cn("min-w-0 flex-1", mobilePane === "agent" && "hidden lg:block")}>
            {view === "canvas" ? (
              <Canvas project={project.value} state={canvas.value!} onSelectionChange={onSel} />
            ) : view === "story" ? (
              <StoryView projectId={id} projectName={project.value.name} />
            ) : view === "editor" ? (
              <EditorView project={project.value} />
            ) : (
              <section className="flex h-full items-center justify-center bg-bg p-6">
                <div className="max-w-md text-center">
                  <h1 className="text-2xl">{PLANNED.stage.title}</h1>
                  <p className="mt-3 text-text-muted">{PLANNED.stage.text}</p>
                  <Link href={`/p/${id}?view=canvas`}><Button variant="secondary" className="mt-6">Aller à la toile</Button></Link>
                </div>
              </section>
            )}
          </main>
          <div className={cn("min-h-0", mobilePane === "canvas" ? "hidden lg:flex" : "flex w-full lg:w-auto")}>
            <AgentPanel projectId={id} selection={selection} nodes={canvas.value!.nodes} collapsed={agentCollapsed} onCollapse={setAgentCollapsed} />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
