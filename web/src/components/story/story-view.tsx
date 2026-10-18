"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import { data } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { storyTemplate } from "@/lib/story";

/** Onglet Histoire (S11) : document à blocs, sauvegardé automatiquement, lu et rempli par l'agent. */
export function StoryView({ projectId }: { projectId: string }) {
  const doc = useLive(() => data.document(projectId), [projectId], projectId);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWritten = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Placeholder.configure({ placeholder: "Écrivez ici…" })],
    editorProps: {
      attributes: { class: "story-prose outline-none", "aria-label": "Document Histoire", role: "textbox", "aria-multiline": "true" },
    },
    onUpdate: ({ editor: e }) => {
      setSaved("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const json = e.getJSON();
        lastWritten.current = JSON.stringify(json);
        await data.saveDocument(projectId, json);
        setSaved("saved");
      }, 600);
    },
  });

  // Contenu initial, puis mises à jour venues de l'agent (si l'utilisateur n'est pas en train d'écrire).
  useEffect(() => {
    if (!editor || doc.loading) return;
    const content = doc.value?.content ?? storyTemplate();
    const incoming = JSON.stringify(content);
    if (incoming === lastWritten.current) return;
    if (editor.isFocused && doc.value) return;
    lastWritten.current = incoming;
    editor.commands.setContent(content as object, false);
  }, [editor, doc.value, doc.loading]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const headings = (editor?.getJSON().content ?? [])
    .filter((n) => n.type === "heading")
    .map((n) => (n.content ?? []).map((c) => c.text).join(""));

  return (
    <div className="relative h-full overflow-y-auto bg-surface">
      <nav aria-label="Plan du document" className="fixed left-4 top-1/2 hidden -translate-y-1/2 xl:block">
        <ul className="space-y-3">
          {headings.map((t, i) => (
            <li key={i}>
              <button
                title={t}
                onClick={() => document.querySelectorAll(".story-prose h2")[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="group flex items-center gap-2 text-sm text-text-muted hover:text-text"
              >
                <span aria-hidden className="h-px w-6 bg-border-input group-hover:bg-text" />
                <span className="sr-only group-hover:not-sr-only">{t}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div data-tour="story" className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <p className="mb-6 text-right text-xs text-text-muted" aria-live="polite">
          {saved === "saving" ? "Enregistrement…" : saved === "saved" ? "Enregistré" : doc.value ? "" : "Modèle d'exemple"}
        </p>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
