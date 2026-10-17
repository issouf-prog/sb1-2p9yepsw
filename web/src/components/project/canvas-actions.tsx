"use client";

import { createContext, useContext } from "react";
import type { AspectRatio, CanvasNode } from "@/lib/data";

export interface CanvasActions {
  ratio: AspectRatio;
  runGenerator(node: CanvasNode, patch: { prompt: string; model: string }): Promise<void>;
  animate(node: CanvasNode): Promise<void>;
  regenerate(node: CanvasNode): Promise<void>;
  update(node: CanvasNode): Promise<void>;
  remove(ids: string[]): Promise<void>;
  duplicate(node: CanvasNode): Promise<void>;
  toggleSection(id: string): Promise<void>;
  preview(node: CanvasNode): void;
}

export const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function useCanvasActions() {
  const c = useContext(CanvasActionsContext);
  if (!c) throw new Error("useCanvasActions hors de la toile");
  return c;
}
