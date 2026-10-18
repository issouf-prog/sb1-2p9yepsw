"use client";

import { createContext, useContext } from "react";
import type { AspectRatio, CanvasNode } from "@/lib/data";
import type { PlanId, VideoResolution } from "@/lib/data/prices";

export interface CanvasActions {
  ratio: AspectRatio;
  plan: PlanId;
  /** Plans visibles du projet (pour @ et l'image de fin). */
  media: CanvasNode[];
  upgrade(): void;
  editFrom(node: CanvasNode): Promise<void>;
  archive(node: CanvasNode): Promise<void>;
  runGenerator(node: CanvasNode, patch: { prompt: string; model: string; voice?: string; seconds?: number; endFrameId?: string; resolution?: VideoResolution; count?: number; sceneIds?: string[] }): Promise<void>;
  /** Texte des notes reliées à ce nœud (prompt par connexion). */
  linkedText(nodeId: string): string;
  characterFrom(node: CanvasNode): Promise<void>;
  rename(node: CanvasNode): Promise<void>;
  animate(node: CanvasNode): Promise<void>;
  regenerate(node: CanvasNode): Promise<void>;
  update(node: CanvasNode): Promise<void>;
  remove(ids: string[]): Promise<void>;
  duplicate(node: CanvasNode): Promise<void>;
  toggleSection(id: string): Promise<void>;
  dissolveSection(id: string): Promise<void>;
  sendToEditor(node: CanvasNode): Promise<void>;
  preview(node: CanvasNode): void;
}

export const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function useCanvasActions() {
  const c = useContext(CanvasActionsContext);
  if (!c) throw new Error("useCanvasActions hors de la toile");
  return c;
}
