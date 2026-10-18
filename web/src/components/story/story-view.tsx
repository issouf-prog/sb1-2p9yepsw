"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import { data } from "@/lib/data";
import { useLive } from "@/hooks/use-live";
import { scenarioOf, storyTemplate, withScenario } from "@/lib/story";
import { classify, fileSlug, readScriptFile, SCRIPT_ACCEPT, ScriptImportError, toDocx, toFdx, toFountain, toPrintHtml } from "@/lib/script";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Onglet Histoire (S11) : document à blocs, sauvegardé automatiquement, lu et rempli par l'agent. */
export function StoryView({ projectId, projectName = "Scénario" }: { projectId: string; projectName?: string }) {
  const doc = useLive(() => data.document(projectId), [projectId], projectId);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWritten = useRef<string>("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ text: string; undo?: object; error?: boolean } | null>(null);
  const [, setTick] = useState(0);

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
      setTick((n) => n + 1);
    },
  });

  const scenario = editor ? scenarioOf(editor.getJSON()) : "";
  const scenes = classify(scenario).filter((l) => l.type === "scene");

  const importFile = async (file: File | undefined) => {
    if (!file || !editor) return;
    try {
      const text = await readScriptFile(file);
      const before = editor.getJSON();
      editor.commands.setContent(withScenario(before, text) as object, true);
      const n = classify(text).filter((l) => l.type === "scene").length;
      setNotice({ text: `Scénario importé depuis « ${file.name} » : ${n} scène${n > 1 ? "s" : ""}.`, undo: before });
    } catch (e) {
      setNotice({ text: e instanceof ScriptImportError ? e.message : "Ce fichier n'a pas pu être lu.", error: true });
    }
  };

  const exportAs = (kind: "fountain" | "fdx" | "docx" | "pdf") => {
    const text = scenario.trim();
    if (!text) return setNotice({ text: "Le scénario est vide : rien à exporter.", error: true });
    const base = fileSlug(projectName);
    if (kind === "fountain") save(new Blob([toFountain(text, projectName)], { type: "text/plain;charset=utf-8" }), `${base}.fountain`);
    if (kind === "fdx") save(new Blob([toFdx(text)], { type: "application/xml" }), `${base}.fdx`);
    if (kind === "docx") save(toDocx(text, projectName), `${base}.docx`);
    if (kind === "pdf") {
      // Impression d'une page mise en forme : le navigateur propose « Enregistrer en PDF ».
      document.getElementById("script-print")?.remove();
      const frame = Object.assign(document.createElement("iframe"), { id: "script-print", title: "Scénario à imprimer" });
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
      document.body.appendChild(frame);
      frame.contentDocument!.open(); frame.contentDocument!.write(toPrintHtml(text, projectName)); frame.contentDocument!.close();
      frame.contentWindow!.focus(); frame.contentWindow!.print();
    }
  };

  /** Sélectionne l'en-tête de scène dans le bloc scénario et le fait défiler à l'écran. */
  const goToScene = (heading: string) => {
    if (!editor) return;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== "codeBlock") return true;
      const at = node.textContent.toLocaleUpperCase("fr").indexOf(heading);
      if (at < 0) return false;
      editor.chain().focus().setTextSelection({ from: pos + 1 + at, to: pos + 1 + at + heading.length }).scrollIntoView().run();
      return false;
    });
  };

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
      {scenes.length > 0 && (
        <nav aria-label="Scènes du scénario" className="fixed right-4 top-28 hidden w-56 2xl:block">
          <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">Scènes · {scenes.length}</p>
          <ol className="max-h-[60vh] space-y-1 overflow-y-auto">
            {scenes.map((s, i) => (
              <li key={i}>
                <button onClick={() => goToScene(s.text)} title={s.text} className="w-full truncate text-left text-sm text-text-muted hover:text-text">
                  {i + 1}. {s.text}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div data-tour="story" className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <p className="mr-auto text-xs text-text-muted" aria-live="polite">
            {saved === "saving" ? "Enregistrement…" : saved === "saved" ? "Enregistré" : doc.value ? "" : "Modèle d'exemple"}
          </p>
          <input ref={fileInput} type="file" hidden accept={SCRIPT_ACCEPT} aria-label="Fichier de scénario"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; importFile(f); }} />
          <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>
            <FileUp aria-hidden className="size-4" /> Importer un scénario
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button size="sm" variant="secondary"><Download aria-hidden className="size-4" /> Exporter le scénario</Button>
            </MenuTrigger>
            <MenuContent side="bottom" align="end">
              <MenuItem onSelect={() => exportAs("pdf")}>PDF (impression)</MenuItem>
              <MenuItem onSelect={() => exportAs("docx")}>Word (.docx)</MenuItem>
              <MenuItem onSelect={() => exportAs("fdx")}>Final Draft (.fdx)</MenuItem>
              <MenuItem onSelect={() => exportAs("fountain")}>Fountain (.fountain)</MenuItem>
            </MenuContent>
          </Menu>
        </div>
        {notice && (
          <div role={notice.error ? "alert" : "status"} className={`mb-6 flex items-center gap-3 border px-4 py-3 text-sm ${notice.error ? "border-danger bg-danger-surface text-danger" : "border-border bg-surface-sunken"}`}>
            <span className="flex-1">{notice.text}</span>
            {notice.undo && <Button size="sm" variant="ghost" onClick={() => { editor?.commands.setContent(notice.undo!, true); setNotice({ text: "Import annulé." }); }}>Annuler</Button>}
            <button onClick={() => setNotice(null)} aria-label="Fermer le message" className="text-text-muted hover:text-text">×</button>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
